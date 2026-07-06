import { PartialType } from '@nestjs/swagger';
import { CreateGenerationDto } from './create-generation.dto';

export class UpdateGenerationDto extends PartialType(CreateGenerationDto) {}
