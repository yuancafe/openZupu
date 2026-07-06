/* eslint-disable */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectMemberService {
  constructor(private readonly prisma: PrismaService) {}

  async create(projectId: string, dto: { username?: string; email?: string; userId?: string; role: string }) {
    let user: any = null;

    if (dto.userId) {
      user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    } else if (dto.username) {
      user = await this.prisma.user.findUnique({ where: { username: dto.username } });
    } else if (dto.email) {
      user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const existing = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: user.id },
      },
    });

    if (existing) {
      throw new BadRequestException('User is already a member of this project');
    }

    return this.prisma.projectMember.create({
      data: {
        projectId,
        userId: user.id,
        role: dto.role || 'EDITOR',
      },
      include: {
        user: {
          select: { id: true, username: true, email: true, role: true },
        },
      },
    });
  }

  async findAll(projectId: string) {
    return this.prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: { id: true, username: true, email: true, role: true },
        },
      },
    });
  }

  async update(projectId: string, memberId: string, dto: { role: string }) {
    const member = await this.prisma.projectMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.projectId !== projectId) {
      throw new NotFoundException('Member not found in this project');
    }

    return this.prisma.projectMember.update({
      where: { id: memberId },
      data: { role: dto.role },
      include: {
        user: {
          select: { id: true, username: true, email: true, role: true },
        },
      },
    });
  }

  async remove(projectId: string, memberId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.projectId !== projectId) {
      throw new NotFoundException('Member not found in this project');
    }

    if (member.role === 'OWNER') {
      const ownerCount = await this.prisma.projectMember.count({
        where: { projectId, role: 'OWNER' },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot remove the last OWNER of a project');
      }
    }

    return this.prisma.projectMember.delete({
      where: { id: memberId },
    });
  }
}
