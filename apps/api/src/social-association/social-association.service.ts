import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@openzupu/database';

@Injectable()
export class SocialAssociationService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.SocialAssociationUncheckedCreateInput) {
    return this.prisma.socialAssociation.create({ data });
  }

  async findAll(projectId?: string) {
    if (projectId) {
      return this.prisma.socialAssociation.findMany({ where: { projectId } });
    }
    return this.prisma.socialAssociation.findMany();
  }

  async findOne(id: string) {
    return this.prisma.socialAssociation.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.SocialAssociationUncheckedUpdateInput) {
    return this.prisma.socialAssociation.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.socialAssociation.delete({ where: { id } });
  }
}
