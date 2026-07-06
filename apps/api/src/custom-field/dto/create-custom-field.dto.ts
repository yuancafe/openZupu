import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomFieldDto {
  @ApiProperty({ required: true })
  @IsString()
  entityType: string;

  @ApiProperty({ required: true })
  @IsString()
  entityId: string;

  @ApiProperty({ required: true })
  @IsString()
  fieldName: string;

  @ApiProperty({ required: true })
  @IsString()
  fieldValue: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fieldType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
