import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Res,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ExportService } from './export.service';
import { ProjectService } from '../project/project.service';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

import { ImportJsonDto } from './dto/import-json.dto';

@Controller('projects/:projectId/export')
export class ExportController {
  constructor(
    private readonly exportService: ExportService,
    private readonly projectService: ProjectService,
  ) {}

  @Get('graphml')
  @UseGuards(AuthGuard('jwt'))
  async exportGraphML(
    @Param('projectId') projectId: string,
    @Res() res: Response,
    @Request() req: any,
  ) {
    await this.projectService.checkProjectAccess(
      projectId,
      req.user.userId,
      'VIEWER',
    );
    const xml = await this.exportService.exportGraphML(projectId);
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="export.graphml"',
    );
    return res.send(xml);
  }

  @Get('json')
  @UseGuards(AuthGuard('jwt'))
  async exportJson(@Param('projectId') projectId: string, @Request() req: any) {
    await this.projectService.checkProjectAccess(
      projectId,
      req.user.userId,
      'VIEWER',
    );
    return this.exportService.exportJson(projectId);
  }

  @Post('import-json')
  @UseGuards(AuthGuard('jwt'))
  async importJson(
    @Param('projectId') projectId: string,
    @Body() data: ImportJsonDto,
    @Request() req: any,
  ) {
    await this.projectService.checkProjectAccess(
      projectId,
      req.user.userId,
      'EDITOR',
    );
    return this.exportService.importJson(projectId, data);
  }

  @Get('csv/:type')
  @UseGuards(AuthGuard('jwt'))
  async exportCsv(
    @Param('projectId') projectId: string,
    @Param('type') type: 'persons' | 'relations',
    @Res() res: Response,
    @Request() req: any,
  ) {
    await this.projectService.checkProjectAccess(
      projectId,
      req.user.userId,
      'VIEWER',
    );
    const csv = await this.exportService.exportCsv(projectId, type);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${type}.csv"`);
    return res.send(Buffer.from(csv, 'utf8'));
  }
}
