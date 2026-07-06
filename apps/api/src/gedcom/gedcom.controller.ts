import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Res,
  Request,
} from '@nestjs/common';
import { GedcomService } from './gedcom.service';
import { ProjectService } from '../project/project.service';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

@Controller('projects/:projectId/gedcom')
export class GedcomController {
  constructor(
    private readonly gedcomService: GedcomService,
    private readonly projectService: ProjectService,
  ) {}

  @Post('import')
  @UseGuards(AuthGuard('jwt'))
  async importGedcom(
    @Param('projectId') projectId: string,
    @Body('data') data: string,
    @Request() req: any,
  ) {
    await this.projectService.checkProjectAccess(
      projectId,
      req.user.userId,
      'EDITOR',
    );
    return this.gedcomService.importGedcom(projectId, data);
  }

  @Get('export')
  @UseGuards(AuthGuard('jwt'))
  async exportGedcom(
    @Param('projectId') projectId: string,
    @Res() res: Response,
    @Request() req: any,
  ) {
    await this.projectService.checkProjectAccess(
      projectId,
      req.user.userId,
      'VIEWER',
    );
    const gedcom = await this.gedcomService.exportGedcom(projectId);
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="export.ged"');
    return res.send(gedcom);
  }
}
