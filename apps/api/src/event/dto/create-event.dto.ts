import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ required: true })
  @IsString()
  projectId: string;

  @ApiProperty({ required: true })
  @IsString()
  eventType: string;

  @ApiProperty({ required: true })
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  placeId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sourceId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  claimId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  confidence?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  privacyLevel?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
