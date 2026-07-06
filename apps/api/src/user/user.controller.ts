import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() createUserDto: CreateUserDto, @Request() req: any) {
    // Only administrators can create ADMIN users
    if (createUserDto.role === 'ADMIN' && req.user.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Only administrators can create ADMIN users',
      );
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);
    return this.userService.create({
      ...createUserDto,
      password: hashedPassword,
    });
  }

  @Get()
  async findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: any,
  ) {
    if (req.user.userId !== id && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('You can only update your own user profile');
    }

    const updateData: any = { ...updateUserDto };
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 12);
    }

    return this.userService.update(id, updateData);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: string, @Request() req: any) {
    if (req.user.userId !== id && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own user profile');
    }
    return this.userService.remove(id);
  }
}
