import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClaimDto {
  @ApiProperty({ required: true })
  @IsString()
  subjectType: string;

  @ApiProperty({ required: true })
  @IsString()
  subjectId: string;

  @ApiProperty({ required: true })
  @IsString()
  predicate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  objectValue?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  evidenceId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sourceId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  quote?: string;

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
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  privacyLevel?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  createdById?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reviewedById?: string;
}
