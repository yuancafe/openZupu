import { Test, TestingModule } from '@nestjs/testing';
import { ExportService } from './export.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ExportService', () => {
  let service: ExportService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      person: {
        findMany: jest.fn(),
      },
      kinshipRelation: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<ExportService>(ExportService);
  });

  describe('exportGraphML', () => {
    it('should successfully escape XML special characters in person names to prevent XML injection', async () => {
      const mockPerson = {
        id: 'person-123',
        givenName: 'John <script>alert("hack")</script>',
        surname: 'Doe & Sons',
        sex: 'Male',
        birthDate: '1990-01-01',
        deathDate: '2020-01-01',
      };

      jest
        .spyOn(mockPrisma.person, 'findMany')
        .mockResolvedValue([mockPerson] as any);
      jest
        .spyOn(mockPrisma.kinshipRelation, 'findMany')
        .mockResolvedValue([] as any);

      const xml = await service.exportGraphML('proj-1');

      // The special characters must be properly escaped
      expect(xml).toContain(
        '<data key="name">John &lt;script&gt;alert(&quot;hack&quot;)&lt;/script&gt; Doe &amp; Sons</data>',
      );
      expect(xml).not.toContain('<script>');
      expect(xml).not.toContain('& Sons');
    });
  });
});
