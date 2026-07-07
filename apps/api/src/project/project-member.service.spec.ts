/* eslint-disable */
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectMemberService } from './project-member.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ProjectMemberService', () => {
  let service: ProjectMemberService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
    projectMember: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectMemberService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<ProjectMemberService>(ProjectMemberService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw NotFoundException if user is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.create('project-123', { username: 'testuser', role: 'EDITOR' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if project is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(
        service.create('project-123', { username: 'testuser', role: 'EDITOR' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user is already a member', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'project-123' });
      mockPrisma.projectMember.findUnique.mockResolvedValue({ id: 'member-123' });

      await expect(
        service.create('project-123', { username: 'testuser', role: 'EDITOR' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create project member successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'project-123' });
      mockPrisma.projectMember.findUnique.mockResolvedValue(null);
      mockPrisma.projectMember.create.mockResolvedValue({
        id: 'member-abc',
        projectId: 'project-123',
        userId: 'user-123',
        role: 'EDITOR',
      });

      const res = await service.create('project-123', {
        username: 'testuser',
        role: 'EDITOR',
      });

      expect(res.id).toBe('member-abc');
      expect(mockPrisma.projectMember.create).toHaveBeenCalled();
    });

    it('should default role to EDITOR when not specified', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'project-123' });
      mockPrisma.projectMember.findUnique.mockResolvedValue(null);
      mockPrisma.projectMember.create.mockResolvedValue({});

      await service.create('project-123', { username: 'testuser' });

      const createCall = mockPrisma.projectMember.create.mock.calls[0][0];
      expect(createCall.data.role).toBe('EDITOR');
    });

    it('should look up user by userId when provided', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'project-123' });
      mockPrisma.projectMember.findUnique.mockResolvedValue(null);
      mockPrisma.projectMember.create.mockResolvedValue({});

      await service.create('project-123', {
        userId: 'user-123',
        role: 'VIEWER',
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('should look up user by email when provided', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-456' });
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'project-123' });
      mockPrisma.projectMember.findUnique.mockResolvedValue(null);
      mockPrisma.projectMember.create.mockResolvedValue({});

      await service.create('project-123', {
        email: 'user@example.com',
        role: 'EDITOR',
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
      });
    });

    it('should return created member with user info', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'project-123' });
      mockPrisma.projectMember.findUnique.mockResolvedValue(null);
      mockPrisma.projectMember.create.mockResolvedValue({
        id: 'member-abc',
        projectId: 'project-123',
        userId: 'user-123',
        role: 'EDITOR',
        user: {
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          role: 'USER',
        },
      });

      const res = await service.create('project-123', {
        username: 'testuser',
        role: 'EDITOR',
      });

      expect(res.user).toEqual({
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
      });
    });
  });

  describe('findAll', () => {
    it('should return all members of a project', async () => {
      mockPrisma.projectMember.findMany.mockResolvedValue([{ id: 'm1' }, { id: 'm2' }]);
      const res = await service.findAll('project-123');
      expect(res).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if member not found in project', async () => {
      mockPrisma.projectMember.findUnique.mockResolvedValue(null);

      await expect(
        service.update('project-123', 'member-999', { role: 'ADMIN' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update role successfully', async () => {
      mockPrisma.projectMember.findUnique.mockResolvedValue({
        id: 'm1',
        projectId: 'p1',
        userId: 'u1',
        role: 'VIEWER',
      });
      mockPrisma.projectMember.update.mockResolvedValue({
        id: 'm1',
        projectId: 'p1',
        userId: 'u1',
        role: 'ADMIN',
      });

      const res = await service.update('p1', 'm1', { role: 'ADMIN' });
      expect(res.role).toBe('ADMIN');
    });
  });

  describe('remove', () => {
    it('should throw BadRequestException if trying to remove the last OWNER', async () => {
      mockPrisma.projectMember.findUnique.mockResolvedValue({
        id: 'm1',
        projectId: 'p1',
        userId: 'u1',
        role: 'OWNER',
      });
      mockPrisma.projectMember.count.mockResolvedValue(1);

      await expect(service.remove('p1', 'm1')).rejects.toThrow(BadRequestException);
    });

    it('should remove member successfully', async () => {
      mockPrisma.projectMember.findUnique.mockResolvedValue({
        id: 'm1',
        projectId: 'p1',
        userId: 'u1',
        role: 'EDITOR',
      });
      mockPrisma.projectMember.delete.mockResolvedValue({ id: 'm1' });

      const res = await service.remove('p1', 'm1');
      expect(res.id).toBe('m1');
    });

    it('should allow removing OWNER when more than 1 exists', async () => {
      mockPrisma.projectMember.findUnique.mockResolvedValue({
        id: 'm1',
        projectId: 'p1',
        userId: 'u1',
        role: 'OWNER',
      });
      mockPrisma.projectMember.count.mockResolvedValue(2); // 2 owners exist
      mockPrisma.projectMember.delete.mockResolvedValue({ id: 'm1' });

      const res = await service.remove('p1', 'm1');
      expect(res.id).toBe('m1');
    });

    it('should throw NotFoundException if member belongs to different project', async () => {
      mockPrisma.projectMember.findUnique.mockResolvedValue({
        id: 'm1',
        projectId: 'OTHER_PROJECT',
        userId: 'u1',
        role: 'EDITOR',
      });

      await expect(service.remove('p1', 'm1')).rejects.toThrow(NotFoundException);
    });
  });
});
