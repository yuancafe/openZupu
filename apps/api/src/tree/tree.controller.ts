import { Controller, Get, Param, Query } from '@nestjs/common';
import { TreeService } from './tree.service';

@Controller('projects/:projectId/tree')
export class TreeController {
  constructor(private readonly treeService: TreeService) {}

  @Get('traditional/:rootPersonId')
  async getTraditionalTree(
    @Param('projectId') projectId: string,
    @Param('rootPersonId') rootPersonId: string,
    @Query('depth') depth?: number,
  ) {
    return this.treeService.getTraditionalTree(projectId, rootPersonId, depth);
  }
}
