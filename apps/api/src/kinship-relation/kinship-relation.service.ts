import { Injectable } from '@nestjs/common';
import { Prisma } from '@openzupu/database';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KinshipRelationService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.KinshipRelationUncheckedCreateInput) {
    return this.prisma.kinshipRelation.create({
      data,
    });
  }

  async findAll(projectId?: string, personId?: string, userId?: string, isSystemAdmin = false) {
    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (personId) {
      where.OR = [{ fromPersonId: personId }, { toPersonId: personId }];
    }

    if (isSystemAdmin) {
      return this.prisma.kinshipRelation.findMany({ where });
    }

    // Non-admin project membership restriction
    where.project = {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    };

    return this.prisma.kinshipRelation.findMany({ where });
  }

  async findOne(id: string) {
    return this.prisma.kinshipRelation.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: Prisma.KinshipRelationUncheckedUpdateInput) {
    return this.prisma.kinshipRelation.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.kinshipRelation.delete({
      where: { id },
    });
  }
}
