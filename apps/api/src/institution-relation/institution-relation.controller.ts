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
import { InstitutionRelationService } from './institution-relation.service';
import { CreateInstitutionRelationDto } from './dto/create-institution-relation.dto';
import { UpdateInstitutionRelationDto } from './dto/update-institution-relation.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('institution-relations')
@ApiTags('InstitutionRelation')
@UseGuards(AuthGuard('jwt'))
export class InstitutionRelationController {
  constructor(private readonly service: InstitutionRelationService) {}

  @Post()
  create(@Body() createDto: CreateInstitutionRelationDto) {
    return this.service.create(createDto);
  }

  @Get()
  findAll(@Query('projectId') projectId?: string) {
    return this.service.findAll(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateInstitutionRelationDto,
  ) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
