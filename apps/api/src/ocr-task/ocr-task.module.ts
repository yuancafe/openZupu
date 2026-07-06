import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OcrTaskService } from './ocr-task.service';
import { OcrTaskController } from './ocr-task.controller';

@Module({
  imports: [PrismaModule],
  controllers: [OcrTaskController],
  providers: [OcrTaskService],
  exports: [OcrTaskService],
})
export class OcrTaskModule {}
