import { IsString, IsOptional, IsBoolean, MaxLength, Matches, IsNumber } from 'class-validator';
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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  biography?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  originalSurname?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  adoptedSurname?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  genealogicalName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  courtesyName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  artName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  tabooName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  posthumousName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  childhoodName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  generationCharacter?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  generationNumber?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  rankInSiblings?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nativePlaceId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ancestralPlaceId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  residencePlaceId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  federatedId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  externalLink?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
