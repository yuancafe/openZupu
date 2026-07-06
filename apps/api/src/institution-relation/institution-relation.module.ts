import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InstitutionRelationService } from './institution-relation.service';
import { InstitutionRelationController } from './institution-relation.controller';

@Module({
  imports: [PrismaModule],
  controllers: [InstitutionRelationController],
  providers: [InstitutionRelationService],
  exports: [InstitutionRelationService],
})
export class InstitutionRelationModule {}
