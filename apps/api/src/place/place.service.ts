import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@openzupu/database';

@Injectable()
export class PlaceService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.PlaceUncheckedCreateInput) {
    return this.prisma.place.create({ data });
  }

  async findAll() {
    return this.prisma.place.findMany();
  }

  async findOne(id: string) {
    return this.prisma.place.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.PlaceUncheckedUpdateInput) {
    return this.prisma.place.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.place.delete({ where: { id } });
  }
}
