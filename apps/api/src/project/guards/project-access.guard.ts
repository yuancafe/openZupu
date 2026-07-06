/* eslint-disable */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ProjectService } from '../project.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectAccessGuard implements CanActivate {
  constructor(
    private readonly projectService: ProjectService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { method, path, params, query, body } = request;

    // Strip global API prefix if present
    const pathWithoutPrefix = path.startsWith('/api') ? path.slice(4) : path;

    // Direct bypass for public routes and MCP (MCP checks project authorization internally per tool)
    const isPublic =
      pathWithoutPrefix === '/' ||
      pathWithoutPrefix === '' ||
      pathWithoutPrefix === '/auth' ||
      pathWithoutPrefix.startsWith('/auth/') ||
      pathWithoutPrefix === '/federation/search' ||
      pathWithoutPrefix.startsWith('/mcp');

    if (isPublic) {
      return true;
    }

    const user = request.user;
    if (!user) {
      return false; // Fail-safe: block if AuthGuard hasn't run on private route
    }

    if (user.role === 'ADMIN') {
      return true;
    }

    let projectId = params.projectId || query.projectId || body.projectId;

    if (!projectId && params.id) {
      projectId = await this.resolveProjectId(path, params.id);
    }

    let minRole = 'VIEWER';
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      minRole = 'EDITOR';
    }

    // Strict project updates & deletions: only project OWNER (or system ADMIN) can update/delete a project
    if (pathWithoutPrefix.startsWith('/projects') && params.id) {
      if (method === 'DELETE') {
        minRole = 'OWNER';
      } else if (['PATCH', 'PUT'].includes(method)) {
        minRole = 'OWNER';
      }
    }

    // Project member management: only OWNER can add/modify/remove project members, VIEWER is enough to read members
    if (pathWithoutPrefix.includes('/members')) {
      if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
        minRole = 'OWNER';
      } else {
        minRole = 'VIEWER';
      }
    }

    if (!projectId) {
      if (
        pathWithoutPrefix.startsWith('/projects') &&
        (method === 'GET' || method === 'POST')
      ) {
        return true;
      }
      if (pathWithoutPrefix.startsWith('/places')) {
        return true;
      }
      throw new BadRequestException('projectId is required for this operation');
    }

    await this.projectService.checkProjectAccess(
      projectId,
      user.userId,
      minRole,
    );
    return true;
  }

  private async resolveProjectId(
    path: string,
    id: string,
  ): Promise<string | null> {
    const pathLower = path.toLowerCase();

    if (pathLower.includes('/projects/')) {
      return id;
    }
    if (pathLower.includes('/persons/')) {
      const rec = await this.prisma.person.findUnique({ where: { id } });
      return rec ? rec.projectId : null;
    }
    if (pathLower.includes('/branches/')) {
      const rec = await this.prisma.branch.findUnique({ where: { id } });
      return rec ? rec.projectId : null;
    }
    if (pathLower.includes('/kinship-relation/')) {
      const rec = await this.prisma.kinshipRelation.findUnique({
        where: { id },
      });
      return rec ? rec.projectId : null;
    }
    if (pathLower.includes('/ocr-tasks/')) {
      const rec = await this.prisma.oCRTask.findUnique({ where: { id } });
      return rec ? rec.projectId : null;
    }
    if (pathLower.includes('/evidences/')) {
      const evidence = await this.prisma.evidence.findUnique({
        where: { id },
        include: { source: true },
      });
      return evidence?.source ? evidence.source.projectId : null;
    }
    if (pathLower.includes('/institution-relations/')) {
      const rec = await this.prisma.institutionRelation.findUnique({
        where: { id },
      });
      return rec ? rec.projectId : null;
    }
    if (pathLower.includes('/status-records/')) {
      const rec = await this.prisma.statusRecord.findUnique({ where: { id } });
      return rec ? rec.projectId : null;
    }
    if (pathLower.includes('/social-associations/')) {
      const rec = await this.prisma.socialAssociation.findUnique({
        where: { id },
      });
      return rec ? rec.projectId : null;
    }
    if (pathLower.includes('/custom-fields/')) {
      const cf = await this.prisma.customField.findUnique({ where: { id } });
      if (!cf) return null;
      if (cf.entityType === 'PERSON') {
        const person = await this.prisma.person.findUnique({
          where: { id: cf.entityId },
        });
        return person ? person.projectId : null;
      }
      if (cf.entityType === 'EVENT') {
        const event = await this.prisma.event.findUnique({
          where: { id: cf.entityId },
        });
        return event ? event.projectId : null;
      }
      return null;
    }
    if (pathLower.includes('/sources/')) {
      const rec = await this.prisma.source.findUnique({ where: { id } });
      return rec ? rec.projectId : null;
    }
    if (pathLower.includes('/office-occupations/')) {
      const rec = await this.prisma.officeOccupation.findUnique({
        where: { id },
      });
      return rec ? rec.projectId : null;
    }
    if (pathLower.includes('/institutions/')) {
      const rec = await this.prisma.institution.findUnique({ where: { id } });
      return rec ? rec.projectId : null;
    }
    if (pathLower.includes('/names/')) {
      const name = await this.prisma.name.findUnique({
        where: { id },
        include: { person: true },
      });
      return name?.person ? name.person.projectId : null;
    }
    if (pathLower.includes('/events/')) {
      const rec = await this.prisma.event.findUnique({ where: { id } });
      return rec ? rec.projectId : null;
    }
    if (pathLower.includes('/generations/')) {
      const rec = await this.prisma.generation.findUnique({ where: { id } });
      return rec ? rec.projectId : null;
    }
    if (pathLower.includes('/claims/')) {
      const claim = await this.prisma.claim.findUnique({ where: { id } });
      if (!claim) return null;
      if (claim.subjectType === 'Person') {
        const rec = await this.prisma.person.findUnique({
          where: { id: claim.subjectId },
        });
        return rec ? rec.projectId : null;
      }
      if (claim.subjectType === 'Event') {
        const rec = await this.prisma.event.findUnique({
          where: { id: claim.subjectId },
        });
        return rec ? rec.projectId : null;
      }
      return null;
    }

    return null;
  }
}
