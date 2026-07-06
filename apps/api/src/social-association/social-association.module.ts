import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SocialAssociationService } from './social-association.service';
import { SocialAssociationController } from './social-association.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SocialAssociationController],
  providers: [SocialAssociationService],
  exports: [SocialAssociationService],
})
export class SocialAssociationModule {}
