import { Body, Controller, Get, Param, Post, Delete, UseFilters } from '@nestjs/common';
import { FriendService } from './friend.service';
import { User } from 'src/common/entities/user.entity';
import { FollowDto } from './dto/follow.dto';
import { QueryFailedErrorFilter } from 'src/common/filters/query-failed.filter';

@Controller('friend')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Get(':id')
  async getFriendsList(@Param('id') id: number): Promise<User[]> {
    return await this.friendService.getFriendsList(id);
  }

  @Post()
  @UseFilters(new QueryFailedErrorFilter())
  async follow(@Body() followDto: FollowDto): Promise<void> {
    await this.friendService.addFriendList(followDto.from, followDto.to);
  }

  @Delete()
  async unfolllw(@Body() followDto: FollowDto): Promise<void> {
    // await this.friendService.r
  }
}
