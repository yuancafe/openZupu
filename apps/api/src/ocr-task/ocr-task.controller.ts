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
import { OcrTaskService } from './ocr-task.service';
import { CreateOcrTaskDto } from './dto/create-ocr-task.dto';
import { UpdateOcrTaskDto } from './dto/update-ocr-task.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('ocr-tasks')
@ApiTags('OCRTask')
@UseGuards(AuthGuard('jwt'))
export class OcrTaskController {
  constructor(private readonly service: OcrTaskService) {}

  @Post()
  create(@Body() createDto: CreateOcrTaskDto) {
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
  update(@Param('id') id: string, @Body() updateDto: UpdateOcrTaskDto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
