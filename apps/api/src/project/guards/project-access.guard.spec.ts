/* eslint-disable */
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ProjectAccessGuard } from './project-access.guard';
import { ProjectService } from '../project.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ProjectAccessGuard', () => {
  let guard: ProjectAccessGuard;
  let mockProjectService: any;
  let mockPrisma: any;

  const createMockContext = (req: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    } as unknown as ExecutionContext);

  beforeEach(async () => {
    mockProjectService = {
      checkProjectAccess: jest.fn().mockResolvedValue(true),
    };
    mockPrisma = {
      person: { findUnique: jest.fn() },
      branch: { findUnique: jest.fn() },
      kinshipRelation: { findUnique: jest.fn() },
      oCRTask: { findUnique: jest.fn() },
      evidence: { findUnique: jest.fn() },
      source: { findUnique: jest.fn() },
      institutionRelation: { findUnique: jest.fn() },
      statusRecord: { findUnique: jest.fn() },
      socialAssociation: { findUnique: jest.fn() },
      customField: { findUnique: jest.fn() },
      officeOccupation: { findUnique: jest.fn() },
      institution: { findUnique: jest.fn() },
      name: { findUnique: jest.fn() },
      event: { findUnique: jest.fn() },
      generation: { findUnique: jest.fn() },
      claim: { findUnique: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectAccessGuard,
        { provide: ProjectService, useValue: mockProjectService },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: Reflector, useValue: { get: jest.fn() } },
      ],
    }).compile();

    guard = module.get<ProjectAccessGuard>(ProjectAccessGuard);
  });

  describe('public route bypass', () => {
    it('should allow access to /auth/login even without user', async () => {
      const ctx = createMockContext({
        path: '/api/auth/login',
        method: 'POST',
        user: undefined,
      });
      expect(await guard.canActivate(ctx)).toBe(true);
    });

    it('should allow access to /auth/register', async () => {
      const ctx = createMockContext({
        path: '/api/auth/register',
        method: 'POST',
        user: undefined,
      });
      expect(await guard.canActivate(ctx)).toBe(true);
    });

    it('should allow access to /auth/refresh', async () => {
      const ctx = createMockContext({
        path: '/api/auth/refresh',
        method: 'POST',
        user: undefined,
      });
      expect(await guard.canActivate(ctx)).toBe(true);
    });

    it('should allow access to /federation/search (public peer discovery)', async () => {
      const ctx = createMockContext({
        path: '/api/federation/search',
        method: 'GET',
        user: undefined,
      });
      expect(await guard.canActivate(ctx)).toBe(true);
    });

    it('should allow access to /mcp/* endpoints (auth handled internally)', async () => {
      const ctx = createMockContext({
        path: '/api/mcp/call',
        method: 'POST',
        user: undefined,
      });
      expect(await guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('fail-safe when no authenticated user', () => {
    it('should deny access to private routes when user is undefined', async () => {
      const ctx = createMockContext({
        path: '/api/persons/p-1',
        method: 'GET',
        params: { id: 'p-1' },
        query: {},
        body: {},
        user: undefined,
      });
      expect(await guard.canActivate(ctx)).toBe(false);
    });
  });

  describe('system admin bypass', () => {
    it('should allow ADMIN role to access any private route', async () => {
      const ctx = createMockContext({
        path: '/api/persons/p-1',
        method: 'PATCH',
        params: { id: 'p-1' },
        query: {},
        body: {},
        user: { userId: 'admin-1', role: 'ADMIN' },
      });
      expect(await guard.canActivate(ctx)).toBe(true);
      expect(mockProjectService.checkProjectAccess).not.toHaveBeenCalled();
    });
  });

  describe('projectId resolution', () => {
    it('should use projectId from params.projectId', async () => {
      const ctx = createMockContext({
        path: '/api/persons',
        method: 'POST',
        params: {},
        query: {},
        body: { projectId: 'proj-1' },
        user: { userId: 'user-1', role: 'USER' },
      });
      expect(await guard.canActivate(ctx)).toBe(true);
      expect(mockProjectService.checkProjectAccess).toHaveBeenCalledWith(
        'proj-1',
        'user-1',
        'EDITOR', // POST => EDITOR minRole
      );
    });

    it('should use projectId from query string', async () => {
      const ctx = createMockContext({
        path: '/api/persons',
        method: 'GET',
        params: {},
        query: { projectId: 'proj-2' },
        body: {},
        user: { userId: 'user-1', role: 'USER' },
      });
      expect(await guard.canActivate(ctx)).toBe(true);
      expect(mockProjectService.checkProjectAccess).toHaveBeenCalledWith(
        'proj-2',
        'user-1',
        'VIEWER',
      );
    });

    it('should resolve projectId via prisma for /persons/:id', async () => {
      mockPrisma.person.findUnique.mockResolvedValue({
        id: 'p-1',
        projectId: 'proj-resolved',
      });
      const ctx = createMockContext({
        path: '/api/persons/p-1',
        method: 'GET',
        params: { id: 'p-1' },
        query: {},
        body: {},
        user: { userId: 'user-1', role: 'USER' },
      });
      expect(await guard.canActivate(ctx)).toBe(true);
      expect(mockPrisma.person.findUnique).toHaveBeenCalledWith({
        where: { id: 'p-1' },
      });
      expect(mockProjectService.checkProjectAccess).toHaveBeenCalledWith(
        'proj-resolved',
        'user-1',
        'VIEWER',
      );
    });

    it('should resolve projectId for /branches/:id', async () => {
      mockPrisma.branch.findUnique.mockResolvedValue({
        id: 'b-1',
        projectId: 'proj-branch',
      });
      const ctx = createMockContext({
        path: '/api/branches/b-1',
        method: 'GET',
        params: { id: 'b-1' },
        query: {},
        body: {},
        user: { userId: 'user-1', role: 'USER' },
      });
      expect(await guard.canActivate(ctx)).toBe(true);
      expect(mockProjectService.checkProjectAccess).toHaveBeenCalledWith(
        'proj-branch',
        'user-1',
        'VIEWER',
      );
    });

    it('should resolve projectId for /kinship-relation/:id', async () => {
      mockPrisma.kinshipRelation.findUnique.mockResolvedValue({
        id: 'kr-1',
        projectId: 'proj-kr',
      });
      const ctx = createMockContext({
        path: '/api/kinship-relation/kr-1',
        method: 'GET',
        params: { id: 'kr-1' },
        query: {},
        body: {},
        user: { userId: 'user-1', role: 'USER' },
      });
      expect(await guard.canActivate(ctx)).toBe(true);
      expect(mockProjectService.checkProjectAccess).toHaveBeenCalledWith(
        'proj-kr',
        'user-1',
        'VIEWER',
      );
    });

    it('should resolve projectId for /events/:id', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        id: 'e-1',
        projectId: 'proj-event',
      });
      const ctx = createMockContext({
        path: '/api/events/e-1',
        method: 'GET',
        params: { id: 'e-1' },
        query: {},
        body: {},
        user: { userId: 'user-1', role: 'USER' },
      });
      expect(await guard.canActivate(ctx)).toBe(true);
      expect(mockProjectService.checkProjectAccess).toHaveBeenCalledWith(
        'proj-event',
        'user-1',
        'VIEWER',
      );
    });

    it('should resolve projectId for /evidences/:id via source relation', async () => {
      mockPrisma.evidence.findUnique.mockResolvedValue({
        id: 'ev-1',
        source: { projectId: 'proj-source' },
      });
      const ctx = createMockContext({
        path: '/api/evidences/ev-1',
        method: 'GET',
        params: { id: 'ev-1' },
        query: {},
        body: {},
        user: { userId: 'user-1', role: 'USER' },
      });
      expect(await guard.canActivate(ctx)).toBe(true);
      expect(mockProjectService.checkProjectAccess).toHaveBeenCalledWith(
        'proj-source',
        'user-1',
        'VIEWER',
      );
    });

    it('should resolve projectId for /names/:id via person relation', async () => {
      mockPrisma.name.findUnique.mockResolvedValue({
        id: 'n-1',
        person: { projectId: 'proj-name' },
      });
      const ctx = createMockContext({
        path: '/api/names/n-1',
        method: 'GET',
        params: { id: 'n-1' },
        query: {},
        body: {},
        user: { userId: 'user-1', role: 'USER' },
      });
      expect(await guard.canActivate(ctx)).toBe(true);
      expect(mockProjectService.checkProjectAccess).toHaveBeenCalledWith(
        'proj-name',
        'user-1',
        'VIEWER',
      );
    });

    it('should resolve projectId for /claims/:id when subjectType is Person', async () => {
      mockPrisma.claim.findUnique.mockResolvedValue({
        id: 'c-1',
        subjectType: 'Person',
        subjectId: 'p-99',
      });
      mockPrisma.person.findUnique.mockResolvedValue({
        id: 'p-99',
        projectId: 'proj-claim',
      });
      const ctx = createMockContext({
        path: '/api/claims/c-1',
        method: 'GET',
        params: { id: 'c-1' },
        query: {},
        body: {},
        user: { userId: 'user-1', role: 'USER' },
      });
      expect(await guard.canActivate(ctx)).toBe(true);
      expect(mockProjectService.checkProjectAccess).toHaveBeenCalledWith(
        'proj-claim',
        'user-1',
        'VIEWER',
      );
    });
  });

  describe('role hierarchy', () => {
    it('should require EDITOR for POST', async () => {
      const ctx = createMockContext({
        path: '/api/persons',
        method: 'POST',
        params: {},
        query: {},
        body: { projectId: 'proj-1' },
        user: { userId: 'user-1', role: 'USER' },
      });
      await guard.canActivate(ctx);
      expect(mockProjectService.checkProjectAccess).toHaveBeenCalledWith(
        'proj-1',
        'user-1',
        'EDITOR',
      );
    });

    it('should require EDITOR for PATCH', async () => {
      const ctx = createMockContext({
        path: '/api/persons/p-1',
        method: 'PATCH',
        params: { id: 'p-1' },
        query: {},
        body: { projectId: 'proj-1' },
        user: { userId: 'user-1', role: 'USER' },
      });
      mockPrisma.person.findUnique.mockResolvedValue({
        id: 'p-1',
        projectId: 'proj-1',
      });
      await guard.canActivate(ctx);
      expect(mockProjectService.checkProjectAccess).toHaveBeenCalledWith(
        'proj-1',
        'user-1',
        'EDITOR',
      );
    });

    it('should require EDITOR for DELETE', async () => {
      mockPrisma.person.findUnique.mockResolvedValue({
        id: 'p-1',
        projectId: 'proj-1',
      });
      const ctx = createMockContext({
        path: '/api/persons/p-1',
        method: 'DELETE',
        params: { id: 'p-1' },
        query: {},
        body: {},
        user: { userId: 'user-1', role: 'USER' },
      });
      await guard.canActivate(ctx);
      expect(mockProjectService.checkProjectAccess).toHaveBeenCalledWith(
        'proj-1',
        'user-1',
        'EDITOR',
      );
    });

    it('should require VIEWER for GET', async () => {
      const ctx = createMockContext({
        path: '/api/persons/p-1',
        method: 'GET',
        params: { id: 'p-1' },
        query: {},
        body: {},
        user: { userId: 'user-1', role: 'USER' },
      });
      mockPrisma.person.findUnique.mockResolvedValue({
        id: 'p-1',
        projectId: 'proj-1',
      });
      await guard.canActivate(ctx);
      expect(mockProjectService.checkProjectAccess).toHaveBeenCalledWith(
        'proj-1',
        'user-1',
        'VIEWER',
      );
    });
  });

  describe('project-level privileged operations', () => {
    it('should require OWNER for PATCH /projects/:id', async () => {
      const ctx = createMockContext({
        path: '/api/projects/proj-1',
        method: 'PATCH',
        params: { id: 'proj-1' },
        query: {},
        body: {},
        user: { userId: 'user-1', role: 'USER' },
      });
      await guard.canActivate(ctx);
      expect(mockProjectService.checkProjectAccess).toHaveBeenCalledWith(
        'proj-1',
        'user-1',
        'OWNER',
      );
    });

    it('should require OWNER for DELETE /projects/:id', async () => {
      const ctx = createMockContext({
        path: '/api/projects/proj-1',
        method: 'DELETE',
        params: { id: 'proj-1' },
        query: {},
        body: {},
        user: { userId: 'user-1', role: 'USER' },
      });
      await guard.canActivate(ctx);
      expect(mockProjectService.checkProjectAccess).toHaveBeenCalledWith(
        'proj-1',
        'user-1',
        'OWNER',
      );
    });

    it('should allow GET /projects (no projectId yet — for create form)', async () => {
      const ctx = createMockContext({
        path: '/api/projects',
        method: 'GET',
        params: {},
        query: {},
        body: {},
        user: { userId: 'user-1', role: 'USER' },
      });
      expect(await guard.canActivate(ctx)).toBe(true);
      expect(mockProjectService.checkProjectAccess).not.toHaveBeenCalled();
    });

    it('should allow POST /projects (creating new project)', async () => {
      const ctx = createMockContext({
        path: '/api/projects',
        method: 'POST',
        params: {},
        query: {},
        body: {},
        user: { userId: 'user-1', role: 'USER' },
      });
      expect(await guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('project member management', () => {
    it('should require OWNER for POST /projects/:projectId/members', async () => {
      const ctx = createMockContext({
        path: '/api/projects/proj-1/members',
        method: 'POST',
        params: { projectId: 'proj-1' },
        query: {},
        body: {},
        user: { userId: 'user-1', role: 'USER' },
      });
      await guard.canActivate(ctx);
      expect(mockProjectService.checkProjectAccess).toHaveBeenCalledWith(
        'proj-1',
        'user-1',
        'OWNER',
      );
    });

    it('should require OWNER for DELETE /projects/:projectId/members/:memberId', async () => {
      const ctx = createMockContext({
        path: '/api/projects/proj-1/members/m-1',
        method: 'DELETE',
        params: { projectId: 'proj-1', memberId: 'm-1' },
        query: {},
        body: {},
        user: { userId: 'user-1', role: 'USER' },
      });
      await guard.canActivate(ctx);
      expect(mockProjectService.checkProjectAccess).toHaveBeenCalledWith(
        'proj-1',
        'user-1',
        'OWNER',
      );
    });

    it('should allow VIEWER for GET /projects/:projectId/members', async () => {
      const ctx = createMockContext({
        path: '/api/projects/proj-1/members',
        method: 'GET',
        params: { projectId: 'proj-1' },
        query: {},
        body: {},
        user: { userId: 'user-1', role: 'USER' },
      });
      await guard.canActivate(ctx);
      expect(mockProjectService.checkProjectAccess).toHaveBeenCalledWith(
        'proj-1',
        'user-1',
        'VIEWER',
      );
    });
  });

  describe('error propagation', () => {
    it('should propagate NotFoundException from checkProjectAccess (project not found)', async () => {
      mockProjectService.checkProjectAccess.mockRejectedValue(
        new Error('Project not found'),
      );
      const ctx = createMockContext({
        path: '/api/persons',
        method: 'POST',
        params: {},
        query: {},
        body: { projectId: 'missing-proj' },
        user: { userId: 'user-1', role: 'USER' },
      });
      await expect(guard.canActivate(ctx)).rejects.toThrow('Project not found');
    });

    it('should propagate ForbiddenException from checkProjectAccess (no membership)', async () => {
      mockProjectService.checkProjectAccess.mockRejectedValue(
        new Error('You do not have access to this project'),
      );
      const ctx = createMockContext({
        path: '/api/persons',
        method: 'GET',
        params: {},
        query: { projectId: 'forbidden-proj' },
        body: {},
        user: { userId: 'user-1', role: 'USER' },
      });
      await expect(guard.canActivate(ctx)).rejects.toThrow(
        'You do not have access to this project',
      );
    });

    it('should throw BadRequestException for routes without projectId that require one', async () => {
      const ctx = createMockContext({
        path: '/api/persons/p-1',
        method: 'GET',
        params: { id: 'p-1' },
        query: {},
        body: {},
        user: { userId: 'user-1', role: 'USER' },
      });
      // person not found => resolveProjectId returns null
      mockPrisma.person.findUnique.mockResolvedValue(null);
      await expect(guard.canActivate(ctx)).rejects.toThrow(BadRequestException);
    });
  });

  describe('edge cases', () => {
    it('should strip /api prefix correctly', async () => {
      // Same path /api/persons and /persons should behave identically
      const ctxWithPrefix = createMockContext({
        path: '/api/persons',
        method: 'POST',
        params: {},
        query: {},
        body: { projectId: 'proj-1' },
        user: { userId: 'user-1', role: 'USER' },
      });
      expect(await guard.canActivate(ctxWithPrefix)).toBe(true);
    });

    it('should handle non-prefixed path', async () => {
      const ctx = createMockContext({
        path: '/persons',
        method: 'POST',
        params: {},
        query: {},
        body: { projectId: 'proj-1' },
        user: { userId: 'user-1', role: 'USER' },
      });
      expect(await guard.canActivate(ctx)).toBe(true);
    });
  });
});