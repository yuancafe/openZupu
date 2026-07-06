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
  Query,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { KinshipRelationService } from './kinship-relation.service';
import { CreateKinshipRelationDto } from './dto/create-kinship-relation.dto';
import { UpdateKinshipRelationDto } from './dto/update-kinship-relation.dto';

@Controller('kinship-relation')
@ApiTags('KinshipRelation')
@UseGuards(AuthGuard('jwt'))
export class KinshipRelationController {
  constructor(
    private readonly kinshipRelationService: KinshipRelationService,
  ) {}

  @Post()
  create(@Body() createDto: CreateKinshipRelationDto) {
    return this.kinshipRelationService.create(createDto);
  }

  @Get()
  findAll(
    @Request() req: any,
    @Query('projectId') projectId?: string,
    @Query('personId') personId?: string,
  ) {
    const isSystemAdmin = req.user?.role === 'ADMIN';
    return this.kinshipRelationService.findAll(projectId, personId, req.user?.userId, isSystemAdmin);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.kinshipRelationService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateKinshipRelationDto) {
    return this.kinshipRelationService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.kinshipRelationService.remove(id);
  }
}
