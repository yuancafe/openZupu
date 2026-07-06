import { IsString, IsOptional, IsBoolean, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePersonDto {
  @ApiProperty()
  @IsString()
  projectId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  surname?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  givenName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sex?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9\s\-\.\,\/]*$/, { message: 'Date contains invalid characters' })
  birthDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9\s\-\.\,\/]*$/, { message: 'Date contains invalid characters' })
  deathDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isLiving?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  patrilinealDna?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  matrilinealDna?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  dnaSampleId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  dnaMarkers?: string;
}
