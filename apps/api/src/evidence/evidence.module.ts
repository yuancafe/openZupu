import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EvidenceService } from './evidence.service';
import { EvidenceController } from './evidence.controller';

@Module({
  imports: [PrismaModule],
  controllers: [EvidenceController],
  providers: [EvidenceService],
  exports: [EvidenceService],
})
export class EvidenceModule {}
