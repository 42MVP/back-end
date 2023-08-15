import { Controller, Get, Body, Put, Param, UseGuards, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '../common/entities/user.entity';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchResponseDto } from './dto/search-response.dto';

@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('search')
  async findByUsername(@Query() query: SearchQueryDto): Promise<SearchResponseDto[]> {
    const userList: User[] = await this.userService.findAllByUsername(query.name);
    const searchResponseList: SearchResponseDto[] = userList.map(user => new SearchResponseDto(user));
    return searchResponseList;
  }

  @Get('id/:id')
  async findOneById(@Param('id') id: number): Promise<User> {
    return await this.userService.findOneById(id);
  }

  @Get('name/:name')
  async findOneByName(@Param('name') name: string): Promise<User> {
    return await this.userService.findOneByUsername(name);
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
