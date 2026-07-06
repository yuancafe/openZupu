import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSourceDto {
  @ApiProperty({ required: true })
  @IsString()
  projectId: string;

  @ApiProperty({ required: true })
  @IsString()
  sourceType: string;

  @ApiProperty({ required: true })
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  compiler?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  year?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  dynasty?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  volume?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  repositoryId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  citation?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reliability?: string;

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
  notes?: string;
}
