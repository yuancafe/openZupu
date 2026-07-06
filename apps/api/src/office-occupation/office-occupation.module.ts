import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OfficeOccupationService } from './office-occupation.service';
import { OfficeOccupationController } from './office-occupation.controller';

@Module({
  imports: [PrismaModule],
  controllers: [OfficeOccupationController],
  providers: [OfficeOccupationService],
  exports: [OfficeOccupationService],
})
export class OfficeOccupationModule {}
