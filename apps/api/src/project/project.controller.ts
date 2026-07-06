/* eslint-disable */
import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  NotFoundException,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

import { ProjectAccessGuard } from './guards/project-access.guard';

@Controller('projects')
@ApiTags('Project')
@UseGuards(AuthGuard('jwt'), ProjectAccessGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  create(@Body() createProjectDto: CreateProjectDto, @Request() req: any) {
    const ownerId = req.user.userId;
    return this.projectService.create({ ...createProjectDto, ownerId } as any);
  }

  @Get()
  findAll(@Request() req: any) {
    const isSystemAdmin = req.user?.role === 'ADMIN';
    return this.projectService.findAll(req.user.userId, isSystemAdmin);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Request() req: any,
  ) {
    const isSystemAdmin = req.user?.role === 'ADMIN';
    return this.projectService.update(
      id,
      updateProjectDto,
      req.user.userId,
      isSystemAdmin,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const isSystemAdmin = req.user?.role === 'ADMIN';
    return this.projectService.remove(id, req.user.userId, isSystemAdmin);
  }
}
