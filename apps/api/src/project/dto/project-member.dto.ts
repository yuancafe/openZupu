import { IsString, IsOptional } from 'class-validator';

export class AddProjectMemberDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  role: string;
}

export class UpdateProjectMemberDto {
  @IsString()
  role: string;
}
