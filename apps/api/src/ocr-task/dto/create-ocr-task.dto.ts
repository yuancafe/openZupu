import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOcrTaskDto {
  @ApiProperty({ required: true })
  @IsString()
  projectId: string;

  @ApiProperty({ required: true })
  @IsString()
  imageUrl: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  result?: string;
}
