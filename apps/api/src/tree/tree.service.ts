import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TreeService {
  constructor(private prisma: PrismaService) {}

  async getTraditionalTree(
    projectId: string,
    rootPersonId: string,
    depth: number = 5,
  ) {
    const [persons, relations] = await Promise.all([
      this.prisma.person.findMany({ where: { projectId } }),
      this.prisma.kinshipRelation.findMany({
        where: {
          projectId,
          relationType: {
            in: [
              'BIOLOGICAL_FATHER_OF',
              'BIOLOGICAL_MOTHER_OF',
              'ADOPTIVE_FATHER_OF',
              'ADOPTIVE_MOTHER_OF',
            ],
          },
        },
      }),
    ]);

    const personMap = new Map<string, any>();
    for (const p of persons) {
      personMap.set(p.id, p);
    }

    const parentToChildrenMap = new Map<string, string[]>();
    for (const rel of relations) {
      const children = parentToChildrenMap.get(rel.fromPersonId) || [];
      children.push(rel.toPersonId);
      parentToChildrenMap.set(rel.fromPersonId, children);
    }

    const visited = new Set<string>();

    const buildNode = (personId: string, currentDepth: number): any => {
      if (currentDepth <= 0) return null;
      if (visited.has(personId)) {
        return null;
      }

      const person = personMap.get(personId);
      if (!person) return null;

      visited.add(personId);

      const childIds = parentToChildrenMap.get(personId) || [];
      const childrenNodes = [];
      for (const childId of childIds) {
        const childNode = buildNode(childId, currentDepth - 1);
        if (childNode) {
          childrenNodes.push(childNode);
        }
      }

      visited.delete(personId);

      return {
        ...person,
        children: childrenNodes,
      };
    };

    const treeRoot = buildNode(rootPersonId, depth);
    return {
      treeType: 'traditional',
      root: treeRoot,
    };
  }
}
