import { IsArray, IsOptional } from 'class-validator';

export class ImportJsonDto {
  @IsArray()
  @IsOptional()
  persons?: any[];

  @IsArray()
  @IsOptional()
  kinshipRelations?: any[];

  @IsArray()
  @IsOptional()
  events?: any[];

  @IsArray()
  @IsOptional()
  sources?: any[];

  @IsArray()
  @IsOptional()
  branches?: any[];

  @IsArray()
  @IsOptional()
  generations?: any[];
}
