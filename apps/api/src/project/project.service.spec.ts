import { Test, TestingModule } from '@nestjs/testing';
import { ProjectService } from './project.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: PrismaService,
          useValue: {
            project: {
              findUnique: jest.fn(),
            },
            projectMember: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('checkProjectAccess', () => {
    it('should grant access to the owner of the project directly', async () => {
      const mockProject = { id: 'proj-1', ownerId: 'owner-123' };
      jest
        .spyOn(prisma.project, 'findUnique')
        .mockResolvedValue(mockProject as any);

      const result = await service.checkProjectAccess(
        'proj-1',
        'owner-123',
        'ADMIN',
      );
      expect(result).toBe(true);
    });

    it('should grant access to a project member with sufficient role', async () => {
      const mockProject = { id: 'proj-1', ownerId: 'owner-123' };
      const mockMember = {
        projectId: 'proj-1',
        userId: 'user-456',
        role: 'ADMIN',
      };
      jest
        .spyOn(prisma.project, 'findUnique')
        .mockResolvedValue(mockProject as any);
      jest
        .spyOn(prisma.projectMember, 'findUnique')
        .mockResolvedValue(mockMember as any);

      const result = await service.checkProjectAccess(
        'proj-1',
        'user-456',
        'EDITOR',
      );
      expect(result).toBe(true);
    });

    it('should throw ForbiddenException if project member has insufficient role', async () => {
      const mockProject = { id: 'proj-1', ownerId: 'owner-123' };
      const mockMember = {
        projectId: 'proj-1',
        userId: 'user-456',
        role: 'VIEWER',
      };
      jest
        .spyOn(prisma.project, 'findUnique')
        .mockResolvedValue(mockProject as any);
      jest
        .spyOn(prisma.projectMember, 'findUnique')
        .mockResolvedValue(mockMember as any);

      await expect(
        service.checkProjectAccess('proj-1', 'user-456', 'EDITOR'),
      ).rejects.toThrow('Insufficient permissions');
    });

    it('should throw ForbiddenException if user is not a member of the project', async () => {
      const mockProject = { id: 'proj-1', ownerId: 'owner-123' };
      jest
        .spyOn(prisma.project, 'findUnique')
        .mockResolvedValue(mockProject as any);
      jest.spyOn(prisma.projectMember, 'findUnique').mockResolvedValue(null);

      await expect(
        service.checkProjectAccess('proj-1', 'external-user', 'VIEWER'),
      ).rejects.toThrow('You do not have access');
    });

    it('should throw NotFoundException if the project does not exist', async () => {
      jest.spyOn(prisma.project, 'findUnique').mockResolvedValue(null);

      await expect(
        service.checkProjectAccess('missing-proj', 'user-123', 'VIEWER'),
      ).rejects.toThrow('Project not found');
    });
  });
});
