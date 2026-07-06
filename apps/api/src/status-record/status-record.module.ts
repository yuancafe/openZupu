import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StatusRecordService } from './status-record.service';
import { StatusRecordController } from './status-record.controller';

@Module({
  imports: [PrismaModule],
  controllers: [StatusRecordController],
  providers: [StatusRecordService],
  exports: [StatusRecordService],
})
export class StatusRecordModule {}
