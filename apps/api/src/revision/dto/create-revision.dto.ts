import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRevisionDto {
  @ApiProperty({ required: true })
  @IsString()
  entityType: string;

  @ApiProperty({ required: true })
  @IsString()
  entityId: string;

  @ApiProperty({ required: true })
  @IsString()
  changes: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userId?: string;
}
