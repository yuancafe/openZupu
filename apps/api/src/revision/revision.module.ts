import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RevisionService } from './revision.service';
import { RevisionController } from './revision.controller';

@Module({
  imports: [PrismaModule],
  controllers: [RevisionController],
  providers: [RevisionService],
  exports: [RevisionService],
})
export class RevisionModule {}
