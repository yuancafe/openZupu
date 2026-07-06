import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CustomFieldService } from './custom-field.service';
import { CustomFieldController } from './custom-field.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CustomFieldController],
  providers: [CustomFieldService],
  exports: [CustomFieldService],
})
export class CustomFieldModule {}
