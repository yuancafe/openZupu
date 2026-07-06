import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@openzupu/database';

@Injectable()
export class OfficeOccupationService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.OfficeOccupationUncheckedCreateInput) {
    return this.prisma.officeOccupation.create({ data });
  }

  async findAll(projectId?: string) {
    if (projectId) {
      return this.prisma.officeOccupation.findMany({ where: { projectId } });
    }
    return this.prisma.officeOccupation.findMany();
  }

  async findOne(id: string) {
    return this.prisma.officeOccupation.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.OfficeOccupationUncheckedUpdateInput) {
    return this.prisma.officeOccupation.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.officeOccupation.delete({ where: { id } });
  }
}
