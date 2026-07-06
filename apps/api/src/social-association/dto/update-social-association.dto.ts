import { PartialType } from '@nestjs/swagger';
import { CreateSocialAssociationDto } from './create-social-association.dto';

export class UpdateSocialAssociationDto extends PartialType(
  CreateSocialAssociationDto,
) {}
