import { Test, TestingModule } from '@nestjs/testing';
import { DuplicateService } from './duplicate.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DuplicateService', () => {
  let service: DuplicateService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      person: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DuplicateService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<DuplicateService>(DuplicateService);
  });

  describe('findDuplicates', () => {
    it('should successfully detect duplicate persons with same surname and givenName', async () => {
      const mockPersons = [
        { id: '1', surname: 'John', givenName: 'Doe', projectId: 'proj-1' },
        { id: '2', surname: 'John', givenName: 'Doe', projectId: 'proj-1' },
        { id: '3', surname: 'Jane', givenName: 'Smith', projectId: 'proj-1' },
      ];

      jest
        .spyOn(mockPrisma.person, 'findMany')
        .mockResolvedValue(mockPersons as any);

      const duplicates = await service.findDuplicates('proj-1');

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].key).toBe('John|Doe');
      expect(duplicates[0].persons).toHaveLength(2);
      expect(duplicates[0].persons.map((p: any) => p.id)).toEqual(['1', '2']);
    });

    it('should return empty list if there are no duplicates', async () => {
      const mockPersons = [
        { id: '1', surname: 'John', givenName: 'Doe', projectId: 'proj-1' },
        { id: '2', surname: 'Jane', givenName: 'Smith', projectId: 'proj-1' },
      ];

      jest
        .spyOn(mockPrisma.person, 'findMany')
        .mockResolvedValue(mockPersons as any);

      const duplicates = await service.findDuplicates('proj-1');
      expect(duplicates).toHaveLength(0);
    });
  });
});
