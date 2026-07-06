import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@openzupu/database';

@Injectable()
export class InstitutionService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.InstitutionUncheckedCreateInput) {
    return this.prisma.institution.create({ data });
  }

  async findAll(projectId?: string) {
    if (projectId) {
      return this.prisma.institution.findMany({ where: { projectId } });
    }
    return this.prisma.institution.findMany();
  }

  async findOne(id: string) {
    return this.prisma.institution.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.InstitutionUncheckedUpdateInput) {
    return this.prisma.institution.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.institution.delete({ where: { id } });
  }
}
