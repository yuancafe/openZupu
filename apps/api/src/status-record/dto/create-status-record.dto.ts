import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStatusRecordDto {
  @ApiProperty({ required: true })
  @IsString()
  projectId: string;

  @ApiProperty({ required: true })
  @IsString()
  personId: string;

  @ApiProperty({ required: true })
  @IsString()
  statusType: string;

  @ApiProperty({ required: true })
  @IsString()
  statusValue: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  date?: string;
}
