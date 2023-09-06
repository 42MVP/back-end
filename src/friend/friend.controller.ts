import { Controller, Get, Post, Delete, UseFilters, UseGuards, Param } from '@nestjs/common';
import { FriendService } from './friend.service';
import { User } from '../common/entities/user.entity';
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

    this.friendService.addFriendsConnectionState(userResponseList);

    return userResponseList;
  }

  @Post('/:id')
  @UseFilters(new QueryFailedErrorFilter())
  async follow(@ExtractId() me: number, @Param('id') target: number): Promise<void> {
    await this.friendService.addFriendList(me, target);
  }

  @Delete('/:id')
  async unfolllw(@ExtractId() me: number, @Param('id') target: number): Promise<void> {
    await this.friendService.removeFriendList(me, target);
  }
}
