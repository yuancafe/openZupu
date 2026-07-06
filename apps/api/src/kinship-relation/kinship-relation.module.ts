import { Module } from '@nestjs/common';
import { KinshipRelationService } from './kinship-relation.service';
import { KinshipRelationController } from './kinship-relation.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [KinshipRelationService],
  controllers: [KinshipRelationController],
})
export class KinshipRelationModule {}
