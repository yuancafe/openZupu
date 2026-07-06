/* eslint-disable */
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjectMemberService } from './project-member.service';
import { AddProjectMemberDto, UpdateProjectMemberDto } from './dto/project-member.dto';

@Controller('projects/:projectId/members')
@UseGuards(AuthGuard('jwt'))
export class ProjectMemberController {
  constructor(private readonly projectMemberService: ProjectMemberService) {}

  @Post()
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: AddProjectMemberDto,
  ) {
    return this.projectMemberService.create(projectId, dto);
  }

  @Get()
  async findAll(@Param('projectId') projectId: string) {
    return this.projectMemberService.findAll(projectId);
  }

  @Patch(':memberId')
  async update(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateProjectMemberDto,
  ) {
    return this.projectMemberService.update(projectId, memberId, dto);
  }

  @Delete(':memberId')
  async remove(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.projectMemberService.remove(projectId, memberId);
  }
}
