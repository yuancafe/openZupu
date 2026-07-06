import { Controller, Post, Body, Param } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('projects/:projectId/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('ocr')
  async processOcr(
    @Param('projectId') projectId: string,
    @Body('imageUrl') imageUrl: string,
  ) {
    return this.aiService.processOcr(projectId, imageUrl);
  }
}
