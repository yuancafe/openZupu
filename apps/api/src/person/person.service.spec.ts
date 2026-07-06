/* eslint-disable */
import { Test, TestingModule } from '@nestjs/testing';
import { PersonService } from './person.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('PersonService', () => {
  let service: PersonService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      project: {
        findFirst: jest.fn(),
      },
      projectMember: {
        findFirst: jest.fn(),
      },
      person: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<PersonService>(PersonService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findGeneticMatches', () => {
    it('should throw NotFoundException if person not found', async () => {
      mockPrisma.person.findUnique.mockResolvedValue(null);
      await expect(service.findGeneticMatches('999', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should calculate genetic matching score correctly', async () => {
      const sourcePerson = {
        id: 'p-1',
        projectId: 'project-1',
        patrilinealDna: 'O-M122',
        matrilinealDna: 'D4',
        dnaMarkers: 'DYS393=13,DYS390=24',
      };

      const matchCandidate = {
        id: 'p-2',
        projectId: 'project-1',
        surname: 'Zhang',
        givenName: 'San',
        patrilinealDna: 'O-M122',
        matrilinealDna: 'D4',
        dnaMarkers: 'DYS393=13,DYS390=24',
      };

      mockPrisma.person.findUnique.mockResolvedValue(sourcePerson);
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'project-1' });
      mockPrisma.person.findMany.mockResolvedValue([matchCandidate]);

      const results = await service.findGeneticMatches('p-1', 'user-1');
      expect(results).toHaveLength(1);
      expect(results[0].score).toBe(150); // 50 (Y-DNA) + 50 (mtDNA) + 50 (markers)
      expect(results[0].reasons).toContain('Patrilineal Y-DNA haplogroup match');
      expect(results[0].reasons).toContain('Matrilineal mtDNA haplogroup match');
    });
  });
});
