/* eslint-disable */
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { McpService } from './mcp.service';
import { CallToolDto } from './dto/call-tool.dto';

import { Request as ExpressRequest } from 'express';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    userId: string;
    role: string;
    username: string;
  };
}

@Controller('mcp')
@ApiTags('MCP')
@UseGuards(AuthGuard('jwt'))
export class McpController {
  constructor(private readonly mcpService: McpService) {}

  @Get('tools')
  async listTools() {
    const tools = await this.mcpService.listTools();
    return { tools };
  }

  @Post('call')
  async callTool(
    @Body() body: CallToolDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const { name, arguments: args } = body;
    if (!name) {
      throw new BadRequestException('Tool name is required');
    }

    const userId = req.user.userId;
    const isAdmin = req.user.role === 'ADMIN';

    return this.mcpService.callTool(name, args || {}, userId, isAdmin);
  }
}
