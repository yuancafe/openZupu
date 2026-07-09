import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@openzupu/database';

@Injectable()
export class PersonService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.PersonUncheckedCreateInput) {
    return this.prisma.person.create({
      data,
    });
  }

  async findAll(projectId?: string, userId?: string, isSystemAdmin = false) {
    if (isSystemAdmin) {
      if (projectId) {
        return this.prisma.person.findMany({ where: { projectId } });
      }
      return this.prisma.person.findMany();
    }

    const projectFilter = {
      project: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
    };

    if (projectId) {
      return this.prisma.person.findMany({
        where: {
          projectId,
          ...projectFilter,
        },
      });
    }

    return this.prisma.person.findMany({
      where: projectFilter,
    });
  }

  async findOne(id: string) {
    const person = await this.prisma.person.findUnique({
      where: { id },
      include: {
        nativePlace: true,
        ancestralPlace: true,
        residencePlace: true,
      },
    });
    if (!person) return null;

    const occupations = await this.prisma.officeOccupation.findMany({ where: { personId: id } });
    const statusRecords = await this.prisma.statusRecord.findMany({ where: { personId: id } });
    const socialAssociationsFrom = await this.prisma.socialAssociation.findMany({ where: { fromId: id } });
    const socialAssociationsTo = await this.prisma.socialAssociation.findMany({ where: { toId: id } });
    const customFields = await this.prisma.customField.findMany({ where: { entityType: 'PERSON', entityId: id } });

    return {
      ...person,
      occupations,
      statusRecords,
      socialAssociations: [...socialAssociationsFrom, ...socialAssociationsTo],
      customFields,
    };
  }

  async update(id: string, data: Prisma.PersonUncheckedUpdateInput) {
    return this.prisma.person.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.person.delete({
      where: { id },
    });
  }

  async findGeneticMatches(personId: string, userId: string, isSystemAdmin = false) {
    const person = await this.prisma.person.findUnique({
      where: { id: personId },
    });
    if (!person) {
      throw new NotFoundException('Person not found');
    }

    if (!isSystemAdmin) {
      // Enforce project visibility access
      const hasAccess = await this.prisma.projectMember.findFirst({
        where: {
          projectId: person.projectId,
          userId,
        },
      });
      const isOwner = await this.prisma.project.findFirst({
        where: {
          id: person.projectId,
          ownerId: userId,
        },
      });
      if (!hasAccess && !isOwner) {
        throw new ForbiddenException('You do not have access to this person');
      }
    }

    // If target has no DNA markers or haplogroups, return empty list
    if (!person.patrilinealDna && !person.matrilinealDna && !person.dnaMarkers) {
      return [];
    }

    // Load all candidates from projects the user is authorized to read
    let candidates: any[] = [];
    if (isSystemAdmin) {
      candidates = await this.prisma.person.findMany({
        where: { id: { not: personId } },
      });
    } else {
      candidates = await this.prisma.person.findMany({
        where: {
          id: { not: personId },
          project: {
            OR: [
              { ownerId: userId },
              { members: { some: { userId } } },
            ],
          },
        },
      });
    }

    const matches = [];

    for (const c of candidates) {
      let score = 0;
      let reason = [];

      // 1. Patrilineal DNA (Y-DNA Haplogroup) Match (Weight: 50)
      if (person.patrilinealDna && c.patrilinealDna) {
        if (person.patrilinealDna.trim().toLowerCase() === c.patrilinealDna.trim().toLowerCase()) {
          score += 50;
          reason.push('Patrilineal Y-DNA haplogroup match');
        }
      }

      // 2. Matrilineal DNA (mtDNA Haplogroup) Match (Weight: 50)
      if (person.matrilinealDna && c.matrilinealDna) {
        if (person.matrilinealDna.trim().toLowerCase() === c.matrilinealDna.trim().toLowerCase()) {
          score += 50;
          reason.push('Matrilineal mtDNA haplogroup match');
        }
      }

      // 3. DNA STR/SNP markers overlap (Weight: 50)
      if (person.dnaMarkers && c.dnaMarkers) {
        const parseMarkers = (markerStr: string): Map<string, string[]> => {
          const m = new Map<string, string[]>();
          const pairs = markerStr.split(';');
          // fall back to comma if semicolon is not used to separate pairs
          const delimiter = markerStr.includes(';') ? ';' : ',';
          const splitPairs = markerStr.split(delimiter);
          for (const pair of splitPairs) {
            const parts = pair.split('=');
            if (parts.length === 2) {
              const locus = parts[0].trim().toLowerCase();
              const alleles = parts[1].split('/').flatMap(v => v.split(',')).map(a => a.trim());
              m.set(locus, alleles);
            } else {
              const val = pair.trim().toLowerCase();
              if (val) {
                m.set(val, [val]);
              }
            }
          }
          return m;
        };

        const mapA = parseMarkers(person.dnaMarkers);
        const mapB = parseMarkers(c.dnaMarkers);

        let sharedLoci = 0;
        let matchingLoci = 0;

        for (const [locus, allelesA] of mapA.entries()) {
          if (mapB.has(locus)) {
            sharedLoci++;
            const allelesB = mapB.get(locus)!;
            const hasSharedAllele = allelesA.some(a => allelesB.includes(a));
            if (hasSharedAllele) {
              matchingLoci++;
            }
          }
        }

        if (sharedLoci > 0) {
          const matchPercent = matchingLoci / sharedLoci;
          const markerPoints = Math.round(matchPercent * 50);
          score += markerPoints;
          reason.push(`DNA STR Markers match: ${matchingLoci}/${sharedLoci} matching loci (${Math.round(matchPercent * 100)}%)`);
        }
      }

      if (score > 0) {
        matches.push({
          person: {
            id: c.id,
            surname: c.surname,
            givenName: c.givenName,
            sex: c.sex,
            patrilinealDna: c.patrilinealDna,
            matrilinealDna: c.matrilinealDna,
          },
          score,
          reasons: reason,
        });
      }
    }

    // Sort by match score descending
    return matches.sort((a, b) => b.score - a.score);
  }
}
