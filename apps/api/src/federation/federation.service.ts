/* eslint-disable */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePeerDto,
  FederatedSearchQueryDto,
  LinkFederatedDto,
} from './dto/federation.dto';

@Injectable()
export class FederationService {
  constructor(private readonly prisma: PrismaService) {}

  async getPeers() {
    return this.prisma.federationPeer.findMany();
  }

  async addPeer(dto: CreatePeerDto) {
    let cleanUrl = dto.url.endsWith('/') ? dto.url.slice(0, -1) : dto.url;

    // Validate HTTPS protocol & SSRF prevention
    try {
      const parsed = new URL(cleanUrl);
      if (parsed.protocol !== 'https:') {
        throw new BadRequestException('Only HTTPS URLs are allowed');
      }

      const hostname = parsed.hostname.toLowerCase();
      if (
        hostname === 'localhost' ||
        hostname.endsWith('.local') ||
        hostname === '127.0.0.1' ||
        hostname === '::1'
      ) {
        throw new BadRequestException('Local/loopback hostnames are not allowed');
      }

      // Check for private network IP address patterns
      const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
      const ipMatch = hostname.match(ipRegex);
      if (ipMatch) {
        const p1 = parseInt(ipMatch[1], 10);
        const p2 = parseInt(ipMatch[2], 10);
        if (
          p1 === 127 ||
          p1 === 10 ||
          (p1 === 192 && p2 === 168) ||
          (p1 === 172 && p2 >= 16 && p2 <= 31) ||
          (p1 === 169 && p2 === 254)
        ) {
          throw new BadRequestException('Private or link-local IP addresses are not allowed');
        }
      }
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException('Invalid URL format');
    }

    return this.prisma.federationPeer.upsert({
      where: { url: cleanUrl },
      update: { name: dto.name, notes: dto.notes, apiKey: dto.apiKey, remoteProjectId: dto.remoteProjectId },
      create: { name: dto.name, url: cleanUrl, notes: dto.notes, apiKey: dto.apiKey, remoteProjectId: dto.remoteProjectId },
    });
  }

  async linkFederated(personId: string, dto: LinkFederatedDto) {
    const person = await this.prisma.person.findUnique({
      where: { id: personId },
    });
    if (!person) {
      throw new NotFoundException('Person not found');
    }
    return this.prisma.person.update({
      where: { id: personId },
      data: {
        federatedId: dto.federatedId,
        externalLink: dto.externalLink,
      },
    });
  }

  // Search local deceased candidates for matching external peer requests (optimized)
  async searchCandidates(query: FederatedSearchQueryDto, authHeader?: string) {
    // 1. Enforce API Key validation if peers are registered with keys
    const peersWithKeys = await this.prisma.federationPeer.findMany({
      where: { apiKey: { not: null } },
    });

    if (peersWithKeys.length > 0) {
      if (!authHeader) {
        throw new ForbiddenException('Authorization header is required');
      }
      const token = authHeader.replace(/^bearer\s+/i, '').trim();
      const matchedPeer = peersWithKeys.find((peer) => peer.apiKey === token);
      if (!matchedPeer) {
        throw new ForbiddenException('Invalid API Key');
      }
      
      // Strict Cross-Project Isolation
      if (matchedPeer.remoteProjectId && query.projectId !== matchedPeer.remoteProjectId) {
        throw new ForbiddenException('You do not have access to this project');
      }
    }

    // 2. Performance: require at least surname or givenName to restrict scanning
    if (!query.surname && !query.givenName) {
      throw new BadRequestException('At least surname or givenName must be provided to search candidates');
    }

    if (!query.projectId) {
      throw new BadRequestException('projectId is required');
    }

    const whereClause: any = {
      projectId: query.projectId,
      isLiving: false,
    };
    if (query.surname) {
      whereClause.surname = { contains: query.surname.trim(), mode: 'insensitive' };
    }
    if (query.givenName) {
      whereClause.givenName = { contains: query.givenName.trim(), mode: 'insensitive' };
    }

    const takeLimit = Math.min(query.take || 10, 50);

    // Load matching rows with limit, and eager load ancestralPlace relation
    const candidates = await this.prisma.person.findMany({
      where: whereClause,
      take: takeLimit,
      include: {
        ancestralPlace: true,
      },
    });

    const results = [];
    const targetBirthYear = query.birthYear;

    for (const c of candidates) {
      let score = 0;

      // 1. Surname Match (Weight: 25)
      if (query.surname && c.surname) {
        if (c.surname.trim() === query.surname.trim()) {
          score += 25;
        }
      }

      // 2. Given Name Match (Weight: 25)
      if (query.givenName && c.givenName) {
        if (c.givenName.trim() === query.givenName.trim()) {
          score += 25;
        }
      }

      // 3. Sex Match (Weight: 10)
      if (query.sex && c.sex) {
        if (c.sex.toLowerCase() === query.sex.toLowerCase()) {
          score += 10;
        }
      }

      // 4. Approximate Birth Year Match (Weight: 20)
      if (targetBirthYear && c.birthDate) {
        const cBirthYear = this.extractYear(c.birthDate);
        if (cBirthYear) {
          const diff = Math.abs(cBirthYear - targetBirthYear);
          if (diff === 0) {
            score += 20;
          } else if (diff <= 3) {
            score += 15;
          } else if (diff <= 8) {
            score += 10;
          }
        }
      }

      // 5. Generation Info Match (Weight: 10)
      if (query.generationCharacter && c.generationCharacter) {
        if (c.generationCharacter.trim() === query.generationCharacter.trim()) {
          score += 5;
        }
      }
      if (
        query.generationNumber !== undefined &&
        c.generationNumber !== undefined
      ) {
        if (c.generationNumber === query.generationNumber) {
          score += 5;
        }
      }

      // 6. Ancestral Place Match (Weight: 10) - Eager loaded without N+1 query
      if (query.ancestralPlace && c.ancestralPlace) {
        if (
          c.ancestralPlace.name.toLowerCase().includes(query.ancestralPlace.toLowerCase()) ||
          query.ancestralPlace.toLowerCase().includes(c.ancestralPlace.name.toLowerCase())
        ) {
          score += 10;
        }
      }

      // Threshold: only return candidates with at least 40% matching score
      if (score >= 40) {
        results.push({
          person: {
            id: c.id,
            surname: c.surname,
            givenName: c.givenName,
            sex: c.sex,
            birthDate: c.birthDate,
            deathDate: c.deathDate,
            generationCharacter: c.generationCharacter,
            generationNumber: c.generationNumber,
          },
          score,
        });
      }
    }

    // Sort by score descending and return at most 50 candidates (prevent DoS)
    return results.sort((a, b) => b.score - a.score).slice(0, 50);
  }

  // Cross check local person against all registered peer nodes in parallel
  async crossCheckPerson(personId: string) {
    const person = await this.prisma.person.findUnique({
      where: { id: personId },
      include: { ancestralPlace: true },
    });

    if (!person) {
      throw new NotFoundException('Person not found');
    }

    const peers = await this.prisma.federationPeer.findMany({ take: 10 });
    if (peers.length === 0) {
      return [];
    }

    const birthYear = this.extractYear(person.birthDate);
    const searchParams = new URLSearchParams();
    if (person.surname) searchParams.append('surname', person.surname);
    if (person.givenName) searchParams.append('givenName', person.givenName);
    if (person.sex) searchParams.append('sex', person.sex);
    if (birthYear) searchParams.append('birthYear', birthYear.toString());
    if (person.generationCharacter)
      searchParams.append('generationCharacter', person.generationCharacter);
    if (
      person.generationNumber !== null &&
      person.generationNumber !== undefined
    ) {
      searchParams.append(
        'generationNumber',
        person.generationNumber.toString(),
      );
    }
    if (person.ancestralPlace?.name) {
      searchParams.append('ancestralPlace', person.ancestralPlace.name);
    }

    const queryString = searchParams.toString();

    // Query peers concurrently
    const queries = peers.map(async (peer) => {
      try {
        const headers: any = {};
        if (peer.apiKey) {
          headers['Authorization'] = `Bearer ${peer.apiKey}`;
        }

        const peerSearchParams = new URLSearchParams(queryString);
        peerSearchParams.append('take', '10');
        if (peer.remoteProjectId) {
          peerSearchParams.append('projectId', peer.remoteProjectId);
        }

        const fetchWithRetry = async (url: string, retries = 2, delay = 500): Promise<Response> => {
          try {
            const res = await fetch(url, { headers });
            if (res.ok) return res;
            if (retries > 0) {
              await new Promise((resolve) => setTimeout(resolve, delay));
              return fetchWithRetry(url, retries - 1, delay * 2);
            }
            return res;
          } catch (err) {
            if (retries > 0) {
              await new Promise((resolve) => setTimeout(resolve, delay));
              return fetchWithRetry(url, retries - 1, delay * 2);
            }
            throw err;
          }
        };

        const targetUrl = `${peer.url}/api/federation/search?${peerSearchParams.toString()}`;

        const response = await Promise.race([
          fetchWithRetry(targetUrl),
          new Promise<Response>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 3000),
          ),
        ]);

        if (!response.ok) {
          return {
            peer: peer.name,
            error: `HTTP ${response.status}`,
            candidates: [],
          };
        }

        let data = (await response.json()) as any[];
        if (Array.isArray(data)) {
          data = data.slice(0, 50);
        }
        return {
          peer: peer.name,
          peerId: peer.id,
          peerUrl: peer.url,
          candidates: data || [],
        };
      } catch (err) {
        return {
          peer: peer.name,
          peerId: peer.id,
          peerUrl: peer.url,
          error: (err as Error).message || 'Connection failed',
          candidates: [],
        };
      }
    });

    return Promise.all(queries);
  }

  private extractYear(dateStr: string | null | undefined): number | null {
    if (!dateStr) return null;
    const match = dateStr.match(/\b\d{4}\b/);
    return match ? parseInt(match[0], 10) : null;
  }
}
