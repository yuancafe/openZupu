import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEvidenceDto {
  @ApiProperty({ required: true })
  @IsString()
  sourceId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  locationInSource?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  originalText?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  transcription?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  translation?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  interpretation?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  confidence?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  createdById?: string;
}
