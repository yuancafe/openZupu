import { Module } from '@nestjs/common';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectModule } from '../project/project.module';

@Module({
  imports: [PrismaModule, ProjectModule],
  controllers: [McpController],
  providers: [McpService],
})
export class McpModule {}
