import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectModule } from './project/project.module';
import { UserModule } from './user/user.module';
import { PersonModule } from './person/person.module';
import { NameModule } from './name/name.module';
import { KinshipRelationModule } from './kinship-relation/kinship-relation.module';
import { EventModule } from './event/event.module';
import { PlaceModule } from './place/place.module';
import { BranchModule } from './branch/branch.module';
import { GenerationModule } from './generation/generation.module';
import { CustomFieldModule } from './custom-field/custom-field.module';
import { EvidenceModule } from './evidence/evidence.module';
import { ClaimModule } from './claim/claim.module';
import { AuthModule } from './auth/auth.module';
import { GedcomController } from './gedcom/gedcom.controller';
import { GedcomService } from './gedcom/gedcom.service';
import { RevisionModule } from './revision/revision.module';
import { SocialAssociationModule } from './social-association/social-association.module';
import { InstitutionModule } from './institution/institution.module';
import { InstitutionRelationModule } from './institution-relation/institution-relation.module';
import { OfficeOccupationModule } from './office-occupation/office-occupation.module';
import { StatusRecordModule } from './status-record/status-record.module';
import { OcrTaskModule } from './ocr-task/ocr-task.module';
import { TreeController } from './tree/tree.controller';
import { TreeService } from './tree/tree.service';
import { ExportController } from './export/export.controller';
import { ExportService } from './export/export.service';
import { AiController } from './ai/ai.controller';
import { AiService } from './ai/ai.service';
import { DuplicateController } from './duplicate/duplicate.controller';
import { DuplicateService } from './duplicate/duplicate.service';
import { SourceModule } from './source/source.module';
import { FederationModule } from './federation/federation.module';
import { McpModule } from './mcp/mcp.module';

import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ProjectAccessGuard } from './project/guards/project-access.guard';

@Module({
  imports: [
    PrismaModule,
    ProjectModule,
    UserModule,
    PersonModule,
    NameModule,
    KinshipRelationModule,
    EventModule,
    PlaceModule,
    BranchModule,
    GenerationModule,
    CustomFieldModule,
    EvidenceModule,
    ClaimModule,
    AuthModule,
    RevisionModule,
    SocialAssociationModule,
    InstitutionModule,
    InstitutionRelationModule,
    OfficeOccupationModule,
    StatusRecordModule,
    OcrTaskModule,
    SourceModule,
    FederationModule,
    McpModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 30, // Limit each client to 30 requests per minute
      },
    ]),
  ],
  controllers: [
    AppController,
    GedcomController,
    TreeController,
    ExportController,
    AiController,
    DuplicateController,
  ],
  providers: [
    AppService,
    GedcomService,
    TreeService,
    ExportService,
    AiService,
    DuplicateService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ProjectAccessGuard,
    },
  ],
})
export class AppModule {}
