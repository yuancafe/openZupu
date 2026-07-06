import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@openzupu/database';

@Injectable()
export class StatusRecordService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.StatusRecordUncheckedCreateInput) {
    return this.prisma.statusRecord.create({ data });
  }

  async findAll(projectId?: string) {
    if (projectId) {
      return this.prisma.statusRecord.findMany({ where: { projectId } });
    }
    return this.prisma.statusRecord.findMany();
  }

  async findOne(id: string) {
    return this.prisma.statusRecord.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.StatusRecordUncheckedUpdateInput) {
    return this.prisma.statusRecord.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.statusRecord.delete({ where: { id } });
  }
}
