/* eslint-disable */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@openzupu/database';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async checkProjectAccess(
    projectId: string,
    userId: string,
    minRole?: string,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (project.ownerId === userId) {
      return true;
    }
    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });
    if (!member) {
      throw new ForbiddenException('You do not have access to this project');
    }
    if (minRole) {
      const roleHierarchy = ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER'];
      const userRoleIndex = roleHierarchy.indexOf(member.role);
      const requiredRoleIndex = roleHierarchy.indexOf(minRole);
      if (userRoleIndex < requiredRoleIndex) {
        throw new ForbiddenException(
          'Insufficient permissions in this project',
        );
      }
    }
    return true;
  }

  async create(data: Prisma.ProjectUncheckedCreateInput) {
    const ownerId = data.ownerId;
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data,
      });
      if (ownerId) {
        await tx.projectMember.create({
          data: {
            projectId: project.id,
            userId: ownerId,
            role: 'OWNER',
          },
        });
      }
      return project;
    });
  }

  async findAll(userId: string, isSystemAdmin = false) {
    if (isSystemAdmin) {
      return this.prisma.project.findMany();
    }
    return this.prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.project.findUnique({
      where: { id },
    });
  }

  async update(
    id: string,
    data: Prisma.ProjectUpdateInput,
    userId?: string,
    isSystemAdmin = false,
  ) {
    if (userId && !isSystemAdmin) {
      await this.checkProjectAccess(id, userId, 'OWNER');
    }
    return this.prisma.project.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId?: string, isSystemAdmin = false) {
    if (userId && !isSystemAdmin) {
      await this.checkProjectAccess(id, userId, 'OWNER');
    }
    return this.prisma.project.delete({
      where: { id },
    });
  }
}
