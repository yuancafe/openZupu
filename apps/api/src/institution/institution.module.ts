import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InstitutionService } from './institution.service';
import { InstitutionController } from './institution.controller';

@Module({
  imports: [PrismaModule],
  controllers: [InstitutionController],
  providers: [InstitutionService],
  exports: [InstitutionService],
})
export class InstitutionModule {}
