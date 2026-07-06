import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNameDto {
  @ApiProperty({ required: true })
  @IsString()
  personId: string;

  @ApiProperty({ required: true })
  @IsString()
  nameValue: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  surname?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  givenName?: string;

  @ApiProperty({ required: true })
  @IsString()
  nameType: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  script?: string;

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
  context?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sourceId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  confidence?: number;
}
