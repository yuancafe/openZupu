import { PartialType } from '@nestjs/swagger';
import { CreateInstitutionRelationDto } from './create-institution-relation.dto';

export class UpdateInstitutionRelationDto extends PartialType(
  CreateInstitutionRelationDto,
) {}
