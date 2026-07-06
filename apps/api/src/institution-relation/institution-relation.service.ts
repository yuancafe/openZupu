import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@openzupu/database';

@Injectable()
export class InstitutionRelationService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.InstitutionRelationUncheckedCreateInput) {
    return this.prisma.institutionRelation.create({ data });
  }

  async findAll(projectId?: string) {
    if (projectId) {
      return this.prisma.institutionRelation.findMany({ where: { projectId } });
    }
    return this.prisma.institutionRelation.findMany();
  }

  async findOne(id: string) {
    return this.prisma.institutionRelation.findUnique({ where: { id } });
  }

  async update(
    id: string,
    data: Prisma.InstitutionRelationUncheckedUpdateInput,
  ) {
    return this.prisma.institutionRelation.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.institutionRelation.delete({ where: { id } });
  }
}
