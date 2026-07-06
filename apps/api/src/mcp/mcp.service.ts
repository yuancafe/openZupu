/* eslint-disable */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectService } from '../project/project.service';

@Injectable()
export class McpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectService: ProjectService,
  ) {}

  async listTools() {
    return [
      {
        name: 'list_projects',
        description: 'Get list of available Zupu projects/books',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'search_persons',
        description: 'Search for people by name in a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Project UUID' },
            query: { type: 'string', description: 'Name query string' },
          },
          required: ['projectId', 'query'],
        },
      },
      {
        name: 'get_person_details',
        description: 'Get detailed biographical card and relations for a person',
        inputSchema: {
          type: 'object',
          properties: {
            personId: { type: 'string', description: 'Person UUID' },
          },
          required: ['personId'],
        },
      },
      {
        name: 'create_person',
        description: 'Add a new person card to a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Project UUID' },
            surname: { type: 'string' },
            givenName: { type: 'string' },
            sex: { type: 'string', description: 'Male, Female, or Unknown' },
            birthDate: { type: 'string', description: 'Standard or traditional date string' },
            deathDate: { type: 'string', description: 'Standard or traditional date string' },
            generationCharacter: { type: 'string', description: 'Generation character (e.g. 世)' },
            generationNumber: { type: 'number', description: 'Generation index' },
            isLiving: { type: 'boolean' },
          },
          required: ['projectId', 'surname', 'givenName'],
        },
      },
      {
        name: 'add_kinship_relation',
        description: 'Link two persons together via a kinship/bloodline relation',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Project UUID' },
            fromPersonId: { type: 'string', description: 'Source person UUID' },
            toPersonId: { type: 'string', description: 'Destination person UUID' },
            relationType: {
              type: 'string',
              description: 'e.g. BIOLOGICAL_FATHER_OF, BIOLOGICAL_MOTHER_OF, ADOPTIVE_FATHER_OF, ADOPTIVE_MOTHER_OF, SPOUSE_OF',
            },
          },
          required: ['projectId', 'fromPersonId', 'toPersonId', 'relationType'],
        },
      },
      {
        name: 'find_duplicates',
        description: 'Find duplicate/matching person profiles in a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Project UUID' },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'export_graphml',
        description: 'Export project social graph network XML format',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Project UUID' },
          },
          required: ['projectId'],
        },
      },
    ];
  }

  async callTool(name: string, args: any, userId: string, isAdmin: boolean) {
    switch (name) {
      case 'list_projects': {
        const projects = await this.projectService.findAll(userId, isAdmin);
        return {
          content: [{ type: 'text', text: JSON.stringify(projects, null, 2) }],
        };
      }

      case 'search_persons': {
        const { projectId, query } = args;
        if (!projectId || !query) {
          throw new BadRequestException('projectId and query are required');
        }
        await this.projectService.checkProjectAccess(projectId, userId, 'VIEWER');

        const persons = await this.prisma.person.findMany({
          where: {
            projectId,
            isLiving: false,
            OR: [
              { surname: { contains: query.trim(), mode: 'insensitive' } as any },
              { givenName: { contains: query.trim(), mode: 'insensitive' } as any },
            ],
          },
          take: 50,
        });

        return {
          content: [{ type: 'text', text: JSON.stringify(persons, null, 2) }],
        };
      }

      case 'get_person_details': {
        const { personId } = args;
        if (!personId) {
          throw new BadRequestException('personId is required');
        }

        const person = await this.prisma.person.findUnique({
          where: { id: personId },
          include: {
            names: true,
            ancestralPlace: true,
            relationsAsFrom: {
              include: {
                toPerson: {
                  select: { id: true, surname: true, givenName: true },
                },
              },
            },
            relationsAsTo: {
              include: {
                fromPerson: {
                  select: { id: true, surname: true, givenName: true },
                },
              },
            },
          },
        });

        if (!person || person.isLiving) {
          throw new NotFoundException('Person not found or is currently living');
        }

        await this.projectService.checkProjectAccess(person.projectId, userId, 'VIEWER');

        return {
          content: [{ type: 'text', text: JSON.stringify(person, null, 2) }],
        };
      }

      case 'create_person': {
        const {
          projectId,
          surname,
          givenName,
          sex,
          birthDate,
          deathDate,
          generationCharacter,
          generationNumber,
          isLiving,
        } = args;

        if (!projectId || !surname || !givenName) {
          throw new BadRequestException('projectId, surname and givenName are required');
        }

        await this.projectService.checkProjectAccess(projectId, userId, 'EDITOR');

        const person = await this.prisma.person.create({
          data: {
            projectId,
            surname,
            givenName,
            sex: sex !== undefined ? sex : 'Unknown',
            birthDate,
            deathDate,
            generationCharacter,
            generationNumber: (() => {
              if (generationNumber === undefined || generationNumber === null) return undefined;
              const parsed = Number(generationNumber);
              return isNaN(parsed) ? undefined : parsed;
            })(),
            isLiving: isLiving !== undefined ? Boolean(isLiving) : true,
          },
        });

        // Audit log revision
        await this.logRevision('PERSON', person.id, 'CREATE', null, person, userId);

        return {
          content: [
            {
              type: 'text',
              text: `Successfully created person: ${surname}${givenName} (ID: ${person.id})`,
            },
          ],
        };
      }

      case 'add_kinship_relation': {
        const { projectId, fromPersonId, toPersonId, relationType } = args;

        if (!projectId || !fromPersonId || !toPersonId || !relationType) {
          throw new BadRequestException('projectId, fromPersonId, toPersonId and relationType are required');
        }

        await this.projectService.checkProjectAccess(projectId, userId, 'EDITOR');

        // Confirm both persons exist and belong to the project
        const fromPerson = await this.prisma.person.findUnique({ where: { id: fromPersonId } });
        const toPerson = await this.prisma.person.findUnique({ where: { id: toPersonId } });

        if (!fromPerson || fromPerson.projectId !== projectId) {
          throw new BadRequestException('fromPersonId is invalid or does not belong to the project');
        }
        if (!toPerson || toPerson.projectId !== projectId) {
          throw new BadRequestException('toPersonId is invalid or does not belong to the project');
        }

        // Determine inverse relation type
        let inverseRelationType = null;
        if (
          relationType === 'BIOLOGICAL_FATHER_OF' ||
          relationType === 'BIOLOGICAL_MOTHER_OF'
        ) {
          inverseRelationType = 'BIOLOGICAL_CHILD_OF';
        } else if (
          relationType === 'ADOPTIVE_FATHER_OF' ||
          relationType === 'ADOPTIVE_MOTHER_OF'
        ) {
          inverseRelationType = 'ADOPTIVE_CHILD_OF';
        } else if (relationType === 'SPOUSE_OF') {
          inverseRelationType = 'SPOUSE_OF';
        }

        const relation = await this.prisma.kinshipRelation.create({
          data: {
            projectId,
            fromPersonId,
            toPersonId,
            relationType,
            inverseRelationType,
            status: 'CONFIRMED',
          },
        });

        // Audit log revision
        await this.logRevision(
          'KINSHIP_RELATION',
          relation.id,
          'CREATE',
          null,
          relation,
          userId,
        );

        return {
          content: [
            {
              type: 'text',
              text: `Successfully established kinship relation (ID: ${relation.id})`,
            },
          ],
        };
      }

      case 'find_duplicates': {
        const { projectId } = args;
        if (!projectId) {
          throw new BadRequestException('projectId is required');
        }

        await this.projectService.checkProjectAccess(projectId, userId, 'VIEWER');

        const persons = await this.prisma.person.findMany({ where: { projectId } });
        const duplicates = [];
        const map = new Map<string, any[]>();

        for (const p of persons) {
          const key = `${p.surname?.trim() || ''}_${p.givenName?.trim() || ''}`;
          let list = map.get(key);
          if (!list) {
            list = [];
            map.set(key, list);
          }
          list.push(p);
        }

        for (const [name, matches] of map.entries()) {
          if (matches.length > 1) {
            duplicates.push({
              name,
              count: matches.length,
              profiles: matches.map((m) => ({
                id: m.id,
                sex: m.sex,
                birthDate: m.birthDate,
                generationNumber: m.generationNumber,
              })),
            });
          }
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(duplicates, null, 2) }],
        };
      }

      case 'export_graphml': {
        const { projectId } = args;
        if (!projectId) {
          throw new BadRequestException('projectId is required');
        }

        await this.projectService.checkProjectAccess(projectId, userId, 'VIEWER');

        const project = await this.prisma.project.findUnique({ where: { id: projectId } });
        if (!project) {
          throw new NotFoundException('Project not found');
        }

        const persons = await this.prisma.person.findMany({ where: { projectId } });
        const relations = await this.prisma.kinshipRelation.findMany({ where: { projectId } });

        const escapeXml = (str: string | null | undefined): string => {
          if (!str) return '';
          return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
        };

        let graphml = `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://graphml.graphdrawing.org/xmlns
         http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd">
  <key id="name" for="node" attr.name="name" attr.type="string"/>
  <key id="sex" for="node" attr.name="sex" attr.type="string"/>
  <key id="birth" for="node" attr.name="birth" attr.type="string"/>
  <key id="type" for="edge" attr.name="relation_type" attr.type="string"/>
  <graph id="G" edgedefault="directed">
`;

        for (const p of persons) {
          const fullName = `${p.surname || ''}${p.givenName || ''}`;
          graphml += `    <node id="${p.id}">
      <data key="name">${escapeXml(fullName)}</data>
      <data key="sex">${escapeXml(p.sex)}</data>
      <data key="birth">${escapeXml(p.birthDate)}</data>
    </node>\n`;
        }

        for (const r of relations) {
          graphml += `    <edge source="${r.fromPersonId}" target="${r.toPersonId}">
      <data key="type">${escapeXml(r.relationType)}</data>
    </edge>\n`;
        }

        graphml += `  </graph>\n</graphml>\n`;

        return {
          content: [{ type: 'text', text: graphml }],
        };
      }

      default:
        throw new BadRequestException(`Unknown tool: ${name}`);
    }
  }

  private async logRevision(
    entityType: string,
    entityId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    before: any,
    after: any,
    userId: string,
  ) {
    try {
      const changes = {
        action,
        before,
        after,
      };
      await this.prisma.revision.create({
        data: {
          entityType,
          entityId,
          changes: JSON.stringify(changes),
          userId,
        },
      });
    } catch (e) {
      console.error('McpService revision logging failed:', e);
    }
  }
}
