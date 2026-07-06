import { Test, TestingModule } from '@nestjs/testing';
import { KinshipRelationService } from './kinship-relation.service';
import { PrismaService } from '../prisma/prisma.service';

describe('KinshipRelationService', () => {
  let service: KinshipRelationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KinshipRelationService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            project: {
              findUnique: jest.fn(),
              create: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            person: {
              findUnique: jest.fn(),
              create: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<KinshipRelationService>(KinshipRelationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
