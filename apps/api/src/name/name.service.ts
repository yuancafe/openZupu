import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@openzupu/database';

@Injectable()
export class NameService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.NameUncheckedCreateInput) {
    return this.prisma.name.create({ data });
  }

  async findAll() {
    return this.prisma.name.findMany();
  }

  async findOne(id: string) {
    return this.prisma.name.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.NameUncheckedUpdateInput) {
    return this.prisma.name.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.name.delete({ where: { id } });
  }
}
