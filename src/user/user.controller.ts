import { Controller, Get, Body, Put, Param, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '../common/entities/user.entity';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<User> {
    return await this.userService.findOneById(id);
  }

  @Get()
  async finAll() {
    return await this.userService.findAll();
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto): Promise<void> {
    return await this.userService.update(id, updateUserDto);
  }
}
