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
import { StatusRecordService } from './status-record.service';
import { CreateStatusRecordDto } from './dto/create-status-record.dto';
import { UpdateStatusRecordDto } from './dto/update-status-record.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('status-records')
@ApiTags('StatusRecord')
@UseGuards(AuthGuard('jwt'))
export class StatusRecordController {
  constructor(private readonly service: StatusRecordService) {}

  @Post()
  create(@Body() createDto: CreateStatusRecordDto) {
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
  update(@Param('id') id: string, @Body() updateDto: UpdateStatusRecordDto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
