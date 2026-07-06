import { PartialType } from '@nestjs/swagger';
import { CreateKinshipRelationDto } from './create-kinship-relation.dto';

export class UpdateKinshipRelationDto extends PartialType(
  CreateKinshipRelationDto,
) {}
