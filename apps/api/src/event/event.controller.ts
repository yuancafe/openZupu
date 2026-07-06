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
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('events')
@ApiTags('Event')
@UseGuards(AuthGuard('jwt'))
export class EventController {
  constructor(private readonly service: EventService) {}

  @Post()
  create(@Body() createDto: CreateEventDto) {
    return this.service.create(createDto);
  }

  @Get()
  findAll(@Request() req: any, @Query('projectId') projectId?: string) {
    const isSystemAdmin = req.user?.role === 'ADMIN';
    return this.service.findAll(projectId, req.user?.userId, isSystemAdmin);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateEventDto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
