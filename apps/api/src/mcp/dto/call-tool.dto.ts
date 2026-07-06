import { IsString, IsObject, IsOptional } from 'class-validator';

export class CallToolDto {
  @IsString()
  name: string;

  @IsObject()
  @IsOptional()
  arguments?: Record<string, any>;
}
