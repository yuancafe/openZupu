import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@openzupu/database';

@Injectable()
export class BranchService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.BranchUncheckedCreateInput) {
    return this.prisma.branch.create({ data });
  }

  async findAll(projectId?: string) {
    if (projectId) {
      return this.prisma.branch.findMany({ where: { projectId } });
    }
    return this.prisma.branch.findMany();
  }

  async findOne(id: string) {
    return this.prisma.branch.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.BranchUncheckedUpdateInput) {
    return this.prisma.branch.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.branch.delete({ where: { id } });
  }
}
