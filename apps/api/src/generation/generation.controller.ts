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
import { GenerationService } from './generation.service';
import { CreateGenerationDto } from './dto/create-generation.dto';
import { UpdateGenerationDto } from './dto/update-generation.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('generations')
@ApiTags('Generation')
@UseGuards(AuthGuard('jwt'))
export class GenerationController {
  constructor(private readonly service: GenerationService) {}

  @Post()
  create(@Body() createDto: CreateGenerationDto) {
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
  update(@Param('id') id: string, @Body() updateDto: UpdateGenerationDto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
