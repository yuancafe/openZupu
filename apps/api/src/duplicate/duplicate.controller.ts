import { Controller, Get, Param } from '@nestjs/common';
import { DuplicateService } from './duplicate.service';

@Controller('projects/:projectId/duplicates')
export class DuplicateController {
  constructor(private readonly duplicateService: DuplicateService) {}

  @Get()
  async findDuplicates(@Param('projectId') projectId: string) {
    return this.duplicateService.findDuplicates(projectId);
  }
}
