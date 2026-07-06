import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSocialAssociationDto {
  @ApiProperty({ required: true })
  @IsString()
  projectId: string;

  @ApiProperty({ required: true })
  @IsString()
  fromId: string;

  @ApiProperty({ required: true })
  @IsString()
  toId: string;

  @ApiProperty({ required: true })
  @IsString()
  relationType: string;

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
  notes?: string;
}
