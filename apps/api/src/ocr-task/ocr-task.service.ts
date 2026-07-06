import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@openzupu/database';

@Injectable()
export class OcrTaskService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.OCRTaskUncheckedCreateInput) {
    return this.prisma.oCRTask.create({ data });
  }

  async findAll(projectId?: string) {
    if (projectId) {
      return this.prisma.oCRTask.findMany({ where: { projectId } });
    }
    return this.prisma.oCRTask.findMany();
  }

  async findOne(id: string) {
    return this.prisma.oCRTask.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.OCRTaskUncheckedUpdateInput) {
    return this.prisma.oCRTask.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.oCRTask.delete({ where: { id } });
  }
}
