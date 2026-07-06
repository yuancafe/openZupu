import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parse } from 'parse-gedcom';

@Injectable()
export class GedcomService {
  constructor(private readonly prisma: PrismaService) {}

  async importGedcom(projectId: string, gedcomData: string) {
    const parsed = parse(gedcomData) as unknown as any[];

    return this.prisma.$transaction(async (tx) => {
      let importedCount = 0;
      let relationsCount = 0;
      const pointerToDbId = new Map<string, string>();

      // Step 1: Create all Persons
      for (const record of parsed) {
        if (record.tag === 'INDI') {
          const nameRecord = record.tree.find((n: any) => n.tag === 'NAME');
          const sexRecord = record.tree.find((n: any) => n.tag === 'SEX');
          const birtRecord = record.tree.find((n: any) => n.tag === 'BIRT');
          const deatRecord = record.tree.find((n: any) => n.tag === 'DEAT');

          const nameValue = nameRecord ? nameRecord.data : 'Unknown';
          let sex = sexRecord ? sexRecord.data : 'Unknown';
          if (sex === 'M') sex = 'Male';
          if (sex === 'F') sex = 'Female';

          // Extract surname and given name if formatted as "Given /Surname/"
          let surname = '';
          let givenName = nameValue;
          if (nameValue.includes('/')) {
            const parts = nameValue.split('/');
            givenName = parts[0].trim();
            surname = parts[1].trim();
          }

          let birthDate: string | null = null;
          let deathDate: string | null = null;
          let isLiving = true;

          if (birtRecord && birtRecord.tree) {
            const dateRec = birtRecord.tree.find((n: any) => n.tag === 'DATE');
            if (dateRec) birthDate = dateRec.data;
          }

          if (deatRecord) {
            isLiving = false;
            if (deatRecord.tree) {
              const dateRec = deatRecord.tree.find((n: any) => n.tag === 'DATE');
              if (dateRec) deathDate = dateRec.data;
            }
          }

          const person = await tx.person.create({
            data: {
              projectId,
              givenName,
              surname,
              sex,
              privacyLevel: 'Private',
              birthDate,
              deathDate,
              isLiving,
            },
          });

          if (record.pointer) {
            pointerToDbId.set(record.pointer, person.id);
          }
          importedCount++;
        }
      }

      // Step 2: Create relations from FAM records
      for (const record of parsed) {
        if (record.tag === 'FAM') {
          const husbRecord = record.tree.find((n: any) => n.tag === 'HUSB');
          const wifeRecord = record.tree.find((n: any) => n.tag === 'WIFE');
          const childRecords = record.tree.filter((n: any) => n.tag === 'CHIL');

          const husbId = husbRecord ? pointerToDbId.get(husbRecord.data) : null;
          const wifeId = wifeRecord ? pointerToDbId.get(wifeRecord.data) : null;

          if (husbId && wifeId) {
            await tx.kinshipRelation.create({
              data: {
                projectId,
                fromPersonId: husbId,
                toPersonId: wifeId,
                relationType: 'SPOUSE_OF',
                status: 'CONFIRMED',
              },
            });
            relationsCount++;
          }

          for (const childRec of childRecords) {
            const childId = pointerToDbId.get(childRec.data);
            if (!childId) continue;

            if (husbId) {
              await tx.kinshipRelation.create({
                data: {
                  projectId,
                  fromPersonId: husbId,
                  toPersonId: childId,
                  relationType: 'BIOLOGICAL_FATHER_OF',
                  status: 'CONFIRMED',
                },
              });
              relationsCount++;
            }

            if (wifeId) {
              await tx.kinshipRelation.create({
                data: {
                  projectId,
                  fromPersonId: wifeId,
                  toPersonId: childId,
                  relationType: 'BIOLOGICAL_MOTHER_OF',
                  status: 'CONFIRMED',
                },
              });
              relationsCount++;
            }
          }
        }
      }

      return { success: true, importedCount, relationsCount };
    });
  }

  async exportGedcom(projectId: string): Promise<string> {
    const persons = await this.prisma.person.findMany({ where: { projectId } });
    const relations = await this.prisma.kinshipRelation.findMany({
      where: { projectId },
    });

    let ged = `0 HEAD\n1 GEDC\n2 VERS 5.5.5\n2 FORM LINEAGE-LINKED\n1 CHAR UTF-8\n`;

    // Add Individuals
    for (const p of persons) {
      ged += `0 @I${p.id}@ INDI\n`;
      ged += `1 NAME ${p.givenName || ''} /${p.surname || ''}/\n`;
      if (p.sex) {
        const sexChar = p.sex === 'Male' ? 'M' : p.sex === 'Female' ? 'F' : 'U';
        ged += `1 SEX ${sexChar}\n`;
      }
      if (p.birthDate) {
        ged += `1 BIRT\n2 DATE ${p.birthDate}\n`;
      }
      if (p.deathDate) {
        ged += `1 DEAT\n2 DATE ${p.deathDate}\n`;
      }
    }

    // We group by families to add FAM records.
    // A family consists of spousal relations or parent-child relations.
    // For simplicity, we can group children under father/mother pairs.
    const families = new Map<
      string,
      { husb?: string; wife?: string; children: string[] }
    >();

    // Find spouse links
    for (const r of relations) {
      if (r.relationType === 'SPOUSE_OF') {
        const key = `${r.fromPersonId}_${r.toPersonId}`;
        families.set(key, {
          husb: r.fromPersonId,
          wife: r.toPersonId,
          children: [],
        });
      }
    }

    // Find parent-child links
    for (const r of relations) {
      if (
        r.relationType === 'BIOLOGICAL_FATHER_OF' ||
        r.relationType === 'BIOLOGICAL_MOTHER_OF'
      ) {
        const parentId = r.fromPersonId;
        const childId = r.toPersonId;

        // Find if parent belongs to an existing family
        let foundFam = false;
        for (const [key, fam] of families.entries()) {
          if (fam.husb === parentId || fam.wife === parentId) {
            if (!fam.children.includes(childId)) {
              fam.children.push(childId);
            }
            foundFam = true;
          }
        }

        // If no family exists, create a single parent family
        if (!foundFam) {
          const key = `single_${parentId}`;
          if (!families.has(key)) {
            const isFather = r.relationType === 'BIOLOGICAL_FATHER_OF';
            families.set(key, {
              husb: isFather ? parentId : undefined,
              wife: !isFather ? parentId : undefined,
              children: [childId],
            });
          } else {
            families.get(key)!.children.push(childId);
          }
        }
      }
    }

    let famIndex = 1;
    for (const fam of families.values()) {
      ged += `0 @F${famIndex}@ FAM\n`;
      if (fam.husb) ged += `1 HUSB @I${fam.husb}@\n`;
      if (fam.wife) ged += `1 WIFE @I${fam.wife}@\n`;
      for (const child of fam.children) {
        ged += `1 CHIL @I${child}@\n`;
      }
      famIndex++;
    }

    ged += `0 TRLR\n`;
    return ged;
  }
}
