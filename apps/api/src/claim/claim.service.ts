import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@openzupu/database';

@Injectable()
export class ClaimService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ClaimUncheckedCreateInput) {
    return this.prisma.claim.create({ data });
  }

  async findAll() {
    return this.prisma.claim.findMany();
  }

  async findOne(id: string) {
    return this.prisma.claim.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.ClaimUncheckedUpdateInput) {
    return this.prisma.claim.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.claim.delete({ where: { id } });
  }
}
