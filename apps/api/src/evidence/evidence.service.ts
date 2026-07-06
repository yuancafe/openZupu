import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@openzupu/database';

@Injectable()
export class EvidenceService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.EvidenceUncheckedCreateInput) {
    return this.prisma.evidence.create({ data });
  }

  async findAll() {
    return this.prisma.evidence.findMany();
  }

  async findOne(id: string) {
    return this.prisma.evidence.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.EvidenceUncheckedUpdateInput) {
    return this.prisma.evidence.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.evidence.delete({ where: { id } });
  }
}
