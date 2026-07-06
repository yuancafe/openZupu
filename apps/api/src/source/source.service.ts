import { Injectable } from '@nestjs/common';
import { Prisma } from '@openzupu/database';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SourceService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.SourceUncheckedCreateInput) {
    return this.prisma.source.create({ data });
  }

  async findAll(projectId?: string) {
    if (projectId) {
      return this.prisma.source.findMany({ where: { projectId } });
    }
    return this.prisma.source.findMany();
  }

  async findOne(id: string) {
    return this.prisma.source.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.SourceUncheckedUpdateInput) {
    return this.prisma.source.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.source.delete({ where: { id } });
  }
}
