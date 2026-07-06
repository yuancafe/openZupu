import { PartialType } from '@nestjs/swagger';
import { CreateOfficeOccupationDto } from './create-office-occupation.dto';

export class UpdateOfficeOccupationDto extends PartialType(
  CreateOfficeOccupationDto,
) {}
