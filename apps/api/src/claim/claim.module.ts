import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ClaimService } from './claim.service';
import { ClaimController } from './claim.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ClaimController],
  providers: [ClaimService],
  exports: [ClaimService],
})
export class ClaimModule {}
