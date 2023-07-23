import { Controller, Get, Param } from '@nestjs/common';
import { FriendService } from './friend.service';

@Controller('friend')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Get(':id')
  async getFriendsList(@Param('id') id: number) {
    return await this.friendService.getFriendsList(id);
  }
}
