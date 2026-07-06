import { IsString, IsUrl, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';

export class CreatePeerDto {
  @IsString()
  name: string;

  @IsUrl({ protocols: ['https'], require_tld: true })
  url: string;

  @IsString()
  @IsOptional()
  apiKey?: string;

  @IsString()
  @IsOptional()
  remoteProjectId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class FederatedSearchQueryDto {
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @IsString()
  @IsOptional()
  surname?: string;

  @IsString()
  @IsOptional()
  givenName?: string;

  @IsString()
  @IsOptional()
  sex?: string;

  @IsNumber()
  @IsOptional()
  birthYear?: number;

  @IsString()
  @IsOptional()
  generationCharacter?: string;

  @IsNumber()
  @IsOptional()
  generationNumber?: number;

  @IsString()
  @IsOptional()
  ancestralPlace?: string;

  @IsNumber()
  @IsOptional()
  take?: number;
}

export class LinkFederatedDto {
  @IsString()
  federatedId: string;

  @IsUrl()
  externalLink: string;
}
