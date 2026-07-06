import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@openzupu/database';

@Injectable()
export class CustomFieldService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.CustomFieldUncheckedCreateInput) {
    return this.prisma.customField.create({ data });
  }

  async findAll() {
    return this.prisma.customField.findMany();
  }

  async findOne(id: string) {
    return this.prisma.customField.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.CustomFieldUncheckedUpdateInput) {
    return this.prisma.customField.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.customField.delete({ where: { id } });
  }
}
