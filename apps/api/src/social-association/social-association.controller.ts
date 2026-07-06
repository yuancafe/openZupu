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
import { SocialAssociationService } from './social-association.service';
import { CreateSocialAssociationDto } from './dto/create-social-association.dto';
import { UpdateSocialAssociationDto } from './dto/update-social-association.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('social-associations')
@ApiTags('SocialAssociation')
@UseGuards(AuthGuard('jwt'))
export class SocialAssociationController {
  constructor(private readonly service: SocialAssociationService) {}

  @Post()
  create(@Body() createDto: CreateSocialAssociationDto) {
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
    @Body() updateDto: UpdateSocialAssociationDto,
  ) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
