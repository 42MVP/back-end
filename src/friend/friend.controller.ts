import { Controller, Get, Param } from '@nestjs/common';
import { FriendService } from './friend.service';
import { User } from 'src/common/entities/user.entity';

@Controller('friend')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Get(':id')
  async getFriendsList(@Param('id') id: number): Promise<User[]> {
    return await this.friendService.getFriendsList(id);
  }
}
