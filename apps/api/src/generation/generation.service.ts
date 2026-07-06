import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@openzupu/database';

@Injectable()
export class GenerationService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.GenerationUncheckedCreateInput) {
    return this.prisma.generation.create({ data });
  }

  async findAll(projectId?: string) {
    if (projectId) {
      return this.prisma.generation.findMany({ where: { projectId } });
    }
    return this.prisma.generation.findMany();
  }

  async findOne(id: string) {
    return this.prisma.generation.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.GenerationUncheckedUpdateInput) {
    return this.prisma.generation.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.generation.delete({ where: { id } });
  }
}
