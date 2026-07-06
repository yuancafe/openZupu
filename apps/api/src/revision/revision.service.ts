import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@openzupu/database';

@Injectable()
export class RevisionService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.RevisionUncheckedCreateInput) {
    return this.prisma.revision.create({ data });
  }

  async findAll() {
    return this.prisma.revision.findMany();
  }

  async findOne(id: string) {
    return this.prisma.revision.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.RevisionUncheckedUpdateInput) {
    return this.prisma.revision.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.revision.delete({ where: { id } });
  }
}
