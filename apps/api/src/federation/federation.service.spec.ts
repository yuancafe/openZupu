/* eslint-disable */
import { Test, TestingModule } from '@nestjs/testing';
import { FederationService } from './federation.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FederationService', () => {
  let service: FederationService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      federationPeer: {
        findMany: jest.fn().mockResolvedValue([]),
        upsert: jest.fn(),
      },
      person: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FederationService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<FederationService>(FederationService);
  });

  describe('searchCandidates', () => {
    it('should only search deceased persons and calculate matching score correctly', async () => {
      const mockDeceasedPersons = [
        {
          id: '1',
          surname: 'Zhang',
          givenName: 'San',
          sex: 'Male',
          birthDate: '1900-05-12',
          isLiving: false,
          generationCharacter: 'Shi',
          generationNumber: 15,
          ancestralPlaceId: 'place-shanghai',
          ancestralPlace: { id: 'place-shanghai', name: 'Shanghai' },
        },
        {
          id: '2',
          surname: 'Zhang',
          givenName: 'Si',
          sex: 'Male',
          birthDate: '1980-01-01',
          isLiving: false,
        },
      ];

      jest.spyOn(mockPrisma.person, 'findMany').mockResolvedValue(mockDeceasedPersons as any);

      const query = {
        projectId: 'project-123',
        surname: 'Zhang',
        givenName: 'San',
        sex: 'Male',
        birthYear: 1900,
        generationCharacter: 'Shi',
        generationNumber: 15,
        ancestralPlace: 'Shanghai',
      };

      const results = await service.searchCandidates(query);

      expect(results).toHaveLength(1);
      expect(results[0].person.id).toBe('1');
      // Score calculation:
      // Surname match: 25
      // GivenName match: 25
      // Sex match: 10
      // Birth year exact match: 20
      // Generation char match: 5
      // Generation number match: 5
      // Ancestral place match: 10
      // Total = 100
      expect(results[0].score).toBe(100);
    });

    it('should exclude candidates below score threshold 40%', async () => {
      const mockDeceasedPersons = [
        {
          id: '3',
          surname: 'Li',
          givenName: 'Wu',
          sex: 'Female',
          birthDate: '1950-10-10',
          isLiving: false,
        },
      ];

      jest.spyOn(mockPrisma.person, 'findMany').mockResolvedValue(mockDeceasedPersons as any);

      const query = {
        projectId: 'project-123',
        surname: 'Zhang',
        givenName: 'San',
        sex: 'Male',
        birthYear: 1900,
      };

      const results = await service.searchCandidates(query);
      expect(results).toHaveLength(0); // Score is 0, below 40% threshold
    });
  });

  describe('crossCheckPerson', () => {
    let originalFetch: any;

    beforeAll(() => {
      originalFetch = global.fetch;
    });

    afterAll(() => {
      global.fetch = originalFetch;
    });

    it('should query all registered peers in parallel and aggregate candidates', async () => {
      const mockLocalPerson = {
        id: 'local-123',
        surname: 'Zhang',
        givenName: 'San',
        sex: 'Male',
        birthDate: '1900-01-01',
        isLiving: false,
        generationCharacter: 'Shi',
        generationNumber: 15,
        ancestralPlace: { name: 'Shanghai' },
      };

      const mockPeers = [
        { id: 'peer-1', name: 'Cao Clan Zupu', url: 'https://cao-zupu.org', apiKey: 'key-1' },
        { id: 'peer-2', name: 'Wang Clan Zupu', url: 'https://wang-zupu.org', apiKey: null },
      ];

      jest.spyOn(mockPrisma.person, 'findUnique').mockResolvedValue(mockLocalPerson as any);
      // For crossCheckPerson, we mock the findMany of peers
      jest.spyOn(mockPrisma.federationPeer, 'findMany').mockResolvedValue(mockPeers as any);

      // Mock global fetch
      const mockCandidates = [
        {
          person: { id: 'ext-1', surname: 'Zhang', givenName: 'San' },
          score: 80,
        },
      ];

      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.startsWith('https://cao-zupu.org')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockCandidates),
          });
        }
        return Promise.resolve({
          ok: false,
          status: 500,
        });
      });

      const response = await service.crossCheckPerson('local-123');

      expect(response).toHaveLength(2);
      expect(response[0].peer).toBe('Cao Clan Zupu');
      expect(response[0].candidates).toEqual(mockCandidates);
      expect(response[1].peer).toBe('Wang Clan Zupu');
      expect(response[1].error).toContain('HTTP 500');
    });
  });
});
