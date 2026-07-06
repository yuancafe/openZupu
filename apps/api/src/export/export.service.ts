import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ImportJsonDto } from './dto/import-json.dto';

function escapeXml(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '';
  let str = String(val);
  // Escapes Excel formula injection: prefixing with single quote
  if (
    str.startsWith('=') ||
    str.startsWith('+') ||
    str.startsWith('-') ||
    str.startsWith('@')
  ) {
    str = `'${str}`;
  }
  // Escape quotes for CSV field quoting
  str = str.replace(/"/g, '""');
  return str;
}

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  async exportGraphML(projectId: string) {
    const persons = await this.prisma.person.findMany({
      where: { projectId },
    });
    const relations = await this.prisma.kinshipRelation.findMany({
      where: { projectId },
    });

    let graphml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    graphml += `<graphml xmlns="http://graphml.graphdrawing.org/xmlns">\n`;
    graphml += `  <graph id="G" edgedefault="directed">\n`;

    // Nodes
    for (const p of persons) {
      graphml += `    <node id="${escapeXml(p.id)}">\n`;
      graphml += `      <data key="name">${escapeXml(p.givenName)} ${escapeXml(p.surname)}</data>\n`;
      graphml += `    </node>\n`;
    }

    // Edges
    for (const r of relations) {
      graphml += `    <edge source="${escapeXml(r.fromPersonId)}" target="${escapeXml(r.toPersonId)}">\n`;
      graphml += `      <data key="type">${escapeXml(r.relationType)}</data>\n`;
      graphml += `    </edge>\n`;
    }

    graphml += `  </graph>\n`;
    graphml += `</graphml>`;

    return graphml;
  }

  async exportJson(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        persons: true,
        kinshipRelations: true,
        events: true,
        sources: {
          include: {
            evidences: {
              include: {
                claims: true,
              },
            },
          },
        },
        branches: true,
        generations: true,
      },
    });
    return project;
  }

  async importJson(projectId: string, data: ImportJsonDto) {
    const {
      persons,
      kinshipRelations,
      events,
      sources,
      branches,
      generations,
    } = data;

    if (persons && Array.isArray(persons)) {
      for (const p of persons) {
        // Strip relations/ids if needed or keep them if they are UUIDs.
        // We'll upsert or simply create them.
        const { id, projectId: _, createdAt, updatedAt, ...personData } = p;
        await this.prisma.person.upsert({
          where: { id: id || '' },
          update: { ...personData, projectId },
          create: { ...personData, id, projectId },
        });
      }
    }

    if (kinshipRelations && Array.isArray(kinshipRelations)) {
      for (const r of kinshipRelations) {
        const { id, projectId: _, createdAt, updatedAt, ...relData } = r;
        await this.prisma.kinshipRelation.upsert({
          where: { id: id || '' },
          update: { ...relData, projectId },
          create: { ...relData, id, projectId },
        });
      }
    }

    if (events && Array.isArray(events)) {
      for (const e of events) {
        const { id, projectId: _, ...eventData } = e;
        await this.prisma.event.upsert({
          where: { id: id || '' },
          update: { ...eventData, projectId },
          create: { ...eventData, id, projectId },
        });
      }
    }

    return { success: true };
  }

  async exportCsv(
    projectId: string,
    type: 'persons' | 'relations',
  ): Promise<string> {
    const BOM = '\ufeff';
    if (type === 'persons') {
      const persons = await this.prisma.person.findMany({
        where: { projectId },
      });
      let csv = 'id,surname,givenName,sex,birthDate,deathDate,isLiving\r\n';
      for (const p of persons) {
        const isLivingStr = p.isLiving ? 'true' : 'false';
        csv += `"${escapeCsv(p.id)}","${escapeCsv(p.surname)}","${escapeCsv(p.givenName)}","${escapeCsv(p.sex)}","${escapeCsv(p.birthDate)}","${escapeCsv(p.deathDate)}","${escapeCsv(isLivingStr)}"\r\n`;
      }
      return BOM + csv;
    } else {
      const relations = await this.prisma.kinshipRelation.findMany({
        where: { projectId },
      });
      let csv = 'id,fromPersonId,toPersonId,relationType,status,confidence\r\n';
      for (const r of relations) {
        csv += `"${escapeCsv(r.id)}","${escapeCsv(r.fromPersonId)}","${escapeCsv(r.toPersonId)}","${escapeCsv(r.relationType)}","${escapeCsv(r.status)}","${escapeCsv(r.confidence)}"\r\n`;
      }
      return BOM + csv;
    }
  }
}
