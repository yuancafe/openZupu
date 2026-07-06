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
import { PersonService } from './person.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';

@Controller('persons')
@ApiTags('Person')
@UseGuards(AuthGuard('jwt'))
export class PersonController {
  constructor(private readonly personService: PersonService) {}

  @Post()
  create(@Body() createPersonDto: CreatePersonDto) {
    return this.personService.create(createPersonDto);
  }

  @Get()
  findAll(@Request() req: any, @Query('projectId') projectId?: string) {
    const isSystemAdmin = req.user?.role === 'ADMIN';
    return this.personService.findAll(projectId, req.user?.userId, isSystemAdmin);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.personService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePersonDto: UpdatePersonDto) {
    return this.personService.update(id, updatePersonDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.personService.remove(id);
  }

  @Get(':id/genetic-matches')
  findGeneticMatches(@Param('id') id: string, @Request() req: any) {
    const isSystemAdmin = req.user?.role === 'ADMIN';
    return this.personService.findGeneticMatches(id, req.user?.userId, isSystemAdmin);
  }
}
