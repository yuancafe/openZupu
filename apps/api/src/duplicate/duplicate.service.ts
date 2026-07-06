import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DuplicateService {
  constructor(private prisma: PrismaService) {}

  async findDuplicates(projectId: string) {
    const persons = await this.prisma.person.findMany({ where: { projectId } });

    const duplicates = [];
    const map = new Map();

    for (const p of persons) {
      if (!p.surname && !p.givenName) continue;
      const key = `${p.surname}|${p.givenName}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    }

    for (const [key, group] of map.entries()) {
      if (group.length > 1) {
        duplicates.push({ key, persons: group });
      }
    }

    return duplicates;
  }
}
