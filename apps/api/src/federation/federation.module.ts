import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FederationController } from './federation.controller';
import { FederationService } from './federation.service';

@Module({
  imports: [PrismaModule],
  controllers: [FederationController],
  providers: [FederationService],
  exports: [FederationService],
})
export class FederationModule {}
