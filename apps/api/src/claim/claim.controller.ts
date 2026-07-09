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
import { ClaimService } from './claim.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('claims')
@ApiTags('Claim')
@UseGuards(AuthGuard('jwt'))
export class ClaimController {
  constructor(private readonly service: ClaimService) {}

  @Post()
  create(@Body() createDto: CreateClaimDto) {
    return this.service.create(createDto);
  }

  @Get()
  findAll(
    @Query('subjectType') subjectType?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.service.findAll(subjectType, subjectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateClaimDto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
