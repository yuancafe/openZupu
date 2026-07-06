import { PartialType } from '@nestjs/swagger';
import { CreateRevisionDto } from './create-revision.dto';

export class UpdateRevisionDto extends PartialType(CreateRevisionDto) {}
