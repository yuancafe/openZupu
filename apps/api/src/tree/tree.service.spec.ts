import { Test, TestingModule } from '@nestjs/testing';
import { TreeService } from './tree.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TreeService', () => {
  let service: TreeService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      person: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 'root-1') {
            return Promise.resolve({
              id: 'root-1',
              givenName: 'John',
              surname: 'Doe',
            });
          }
          if (where.id === 'child-1') {
            return Promise.resolve({
              id: 'child-1',
              givenName: 'Jimmy',
              surname: 'Doe',
            });
          }
          return Promise.resolve(null);
        }),
        findMany: jest.fn().mockResolvedValue([
          { id: 'root-1', givenName: 'John', surname: 'Doe' },
          { id: 'child-1', givenName: 'Jimmy', surname: 'Doe' },
        ]),
      },
      kinshipRelation: {
        findMany: jest.fn().mockResolvedValue([
          {
            fromPersonId: 'root-1',
            toPersonId: 'child-1',
            relationType: 'BIOLOGICAL_FATHER_OF',
          },
        ]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TreeService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<TreeService>(TreeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should recursively fetch descendant tree structure correctly', async () => {
    const result = await service.getTraditionalTree('project-1', 'root-1', 3);

    expect(result.treeType).toBe('traditional');
    expect(result.root.id).toBe('root-1');
    expect(result.root.children).toHaveLength(1);
    expect(result.root.children[0].id).toBe('child-1');
    expect(result.root.children[0].children).toHaveLength(0);
  });
});
