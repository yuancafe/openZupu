import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SourceService } from './source.service';
import { SourceController } from './source.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SourceController],
  providers: [SourceService],
  exports: [SourceService],
})
export class SourceModule {}
