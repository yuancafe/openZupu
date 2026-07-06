import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGenerationDto {
  @ApiProperty({ required: true })
  @IsString()
  projectId: string;

  @ApiProperty({ required: true })
  @IsNumber()
  generationNumber: number;

  @ApiProperty({ required: true })
  @IsString()
  character: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  poem?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
