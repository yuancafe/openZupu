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
import { OfficeOccupationService } from './office-occupation.service';
import { CreateOfficeOccupationDto } from './dto/create-office-occupation.dto';
import { UpdateOfficeOccupationDto } from './dto/update-office-occupation.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('office-occupations')
@ApiTags('OfficeOccupation')
@UseGuards(AuthGuard('jwt'))
export class OfficeOccupationController {
  constructor(private readonly service: OfficeOccupationService) {}

  @Post()
  create(@Body() createDto: CreateOfficeOccupationDto) {
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
    @Body() updateDto: UpdateOfficeOccupationDto,
  ) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
