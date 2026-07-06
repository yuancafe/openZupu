import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateKinshipRelationDto {
  @ApiProperty()
  @IsString()
  projectId: string;

  @ApiProperty()
  @IsString()
  fromPersonId: string;

  @ApiProperty()
  @IsString()
  toPersonId: string;

  @ApiProperty()
  @IsString()
  relationType: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  inverseRelationType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  confidence?: number;

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
  @IsString()
  notes?: string;
}
