import { Module, Global } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { ProjectMemberService } from './project-member.service';
import { ProjectMemberController } from './project-member.controller';

@Global()
@Module({
  providers: [ProjectService, ProjectMemberService],
  controllers: [ProjectController, ProjectMemberController],
  exports: [ProjectService, ProjectMemberService],
})
export class ProjectModule {}
