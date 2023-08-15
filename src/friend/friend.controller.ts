import { Body, Controller, Get, Post, Delete, UseFilters, UseGuards } from '@nestjs/common';
import { FriendService } from './friend.service';
import { User } from '../common/entities/user.entity';
import { FollowDto } from './dto/follow.dto';
import { QueryFailedErrorFilter } from '../common/filters/query-failed.filter';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { ExtractId } from 'src/common/decorators/extract-id.decorator';
import { UserResponseBaseDto } from 'src/user/dto/user-response-base.dto';

@UseGuards(JwtAuthGuard)
@Controller('friend')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Get()
  async getFriendsList(@ExtractId() id: number): Promise<UserResponseBaseDto[]> {
    const userList: User[] = await this.friendService.getFriendsList(id);
    const userResponseList: UserResponseBaseDto[] = userList.map(user => new UserResponseBaseDto(user));
    return userResponseList;
  }

  @Post()
  @UseFilters(new QueryFailedErrorFilter())
  async follow(@Body() followDto: FollowDto): Promise<void> {
    await this.friendService.addFriendList(followDto.from, followDto.to);
  }

  @Delete()
  async unfolllw(@Body() followDto: FollowDto): Promise<void> {
    await this.friendService.removeFriendList(followDto.from, followDto.to);
  }
}
