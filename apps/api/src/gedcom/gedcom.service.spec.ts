/* eslint-disable */
import { Test, TestingModule } from '@nestjs/testing';
import { GedcomService } from './gedcom.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('parse-gedcom', () => ({
  parse: jest.fn().mockReturnValue([
    {
      tag: 'INDI',
      pointer: '@I1@',
      tree: [
        { tag: 'NAME', data: 'John /Doe/' },
        { tag: 'SEX', data: 'M' },
        {
          tag: 'BIRT',
          tree: [{ tag: 'DATE', data: '1900-01-01' }],
        },
      ],
    },
    {
      tag: 'INDI',
      pointer: '@I2@',
      tree: [
        { tag: 'NAME', data: 'Jane /Smith/' },
        { tag: 'SEX', data: 'F' },
        {
          tag: 'DEAT',
          tree: [{ tag: 'DATE', data: '1980-05-05' }],
        },
      ],
    },
    {
      tag: 'INDI',
      pointer: '@I3@',
      tree: [
        { tag: 'NAME', data: 'Jimmy /Doe/' },
        { tag: 'SEX', data: 'M' },
      ],
    },
    {
      tag: 'FAM',
      tree: [
        { tag: 'HUSB', data: '@I1@' },
        { tag: 'WIFE', data: '@I2@' },
        { tag: 'CHIL', data: '@I3@' },
      ],
    },
  ]),
}));

describe('GedcomService', () => {
  let service: GedcomService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      person: {
        create: jest.fn().mockImplementation(({ data }) => {
          return Promise.resolve({
            id: `person-${data.givenName}-${data.surname}`,
            ...data,
          });
        }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      kinshipRelation: {
        create: jest.fn().mockImplementation(({ data }) => {
          return Promise.resolve({
            id: 'rel-1',
            ...data,
          });
        }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn(),
    };
    mockPrisma.$transaction.mockImplementation(async (cb) => cb(mockPrisma));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GedcomService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<GedcomService>(GedcomService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should import individuals and map relationships correctly from FAM', async () => {
    const gedcomData = `
0 @I1@ INDI
1 NAME John /Doe/
1 SEX M
1 BIRT
2 DATE 1900-01-01
0 @I2@ INDI
1 NAME Jane /Smith/
1 SEX F
1 DEAT
2 DATE 1980-05-05
0 @I3@ INDI
1 NAME Jimmy /Doe/
1 SEX M
0 @F1@ FAM
1 HUSB @I1@
1 WIFE @I2@
1 CHIL @I3@
    `.trim();

    const result = await service.importGedcom('project-123', gedcomData);

    expect(result.success).toBe(true);
    expect(result.importedCount).toBe(3);
    expect(mockPrisma.person.create).toHaveBeenCalledTimes(3);

    // Verify birthDate, deathDate and isLiving flag mapping
    expect(mockPrisma.person.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          givenName: 'John',
          surname: 'Doe',
          birthDate: '1900-01-01',
          isLiving: true,
        }),
      }),
    );

    expect(mockPrisma.person.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          givenName: 'Jane',
          surname: 'Smith',
          deathDate: '1980-05-05',
          isLiving: false,
        }),
      }),
    );

    expect(result.relationsCount).toBe(3);
    expect(mockPrisma.kinshipRelation.create).toHaveBeenCalledTimes(3);
  });
});
