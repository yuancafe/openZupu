import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@openzupu/database';

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.EventUncheckedCreateInput) {
    return this.prisma.event.create({ data });
  }

  async findAll(projectId?: string, userId?: string, isSystemAdmin = false) {
    if (isSystemAdmin) {
      if (projectId) {
        return this.prisma.event.findMany({ where: { projectId } });
      }
      return this.prisma.event.findMany();
    }

    const projectFilter = {
      project: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
    };

    if (projectId) {
      return this.prisma.event.findMany({
        where: {
          projectId,
          ...projectFilter,
        },
      });
    }

    return this.prisma.event.findMany({
      where: projectFilter,
    });
  }

  async findOne(id: string) {
    return this.prisma.event.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.EventUncheckedUpdateInput) {
    return this.prisma.event.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.event.delete({ where: { id } });
  }
}
