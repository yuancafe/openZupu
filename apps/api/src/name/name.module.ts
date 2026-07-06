import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NameService } from './name.service';
import { NameController } from './name.controller';

@Module({
  imports: [PrismaModule],
  controllers: [NameController],
  providers: [NameService],
  exports: [NameService],
})
export class NameModule {}
