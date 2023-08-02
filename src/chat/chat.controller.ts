import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { ExtractId } from 'src/common/decorators/extract-id.decorator';
import { newChatRoomDto } from './dto/request/new-chat-room.dto';
import { EnterChatRoomDto } from './dto/request/enter-chat-room.dto';
import { ChangeChatRoomDto } from './dto/request/change-chat-room.dto';
import { FindChatUserDto } from './dto/request/find-chat-user.dto';
import { UpdateChatRoleDto } from './dto/request/update-chat-role.dto';
import { UpdateChatStatusDto } from './dto/request/update-chat-status.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('search')
  findAllChannel(@ExtractId() userId: number) {
    return this.chatService.findFreshChannels(userId);
  }

  @Get(':username')
  getChatRoomList(@ExtractId() userId: number, @Param('username') userName: string) {
    return this.chatService.getChatRoomList(userId, userName);
  }

  @Post('create-room')
  createChatRoom(@ExtractId() userId: number, @Body() newRoomInfo: newChatRoomDto) {
    return this.chatService.createChatRoom(userId, newRoomInfo);
  }

  @Post('enter-room')
  enterChatRoom(@ExtractId() userId: number, @Body() newChatUser: EnterChatRoomDto) {
    return this.chatService.enterChatRoom(userId, newChatUser);
  }

  @Post('invite')
  inviteChatUser(@ExtractId() userId: number, @Body() invitedChatUser: FindChatUserDto) {
    return this.chatService.inviteChatUser(userId, invitedChatUser);
  }

  @Patch('change-room-info')
  changeChatRoomInfo(@ExtractId() userId: number, @Body() changeRoomInfo: ChangeChatRoomDto) {
    return this.chatService.changeChatRoomInfo(userId, changeRoomInfo);
  }

  @Patch('change-role')
  changeChatUserRole(@ExtractId() userId: number, @Body() newChatRole: UpdateChatRoleDto) {
    return this.chatService.changeChatUserRole(userId, newChatRole);
  }

  @Patch('change-status')
  changeChatUserStatus(@ExtractId() userId: number, @Body() newChatStatus: UpdateChatStatusDto) {
    return this.chatService.changeChatUserStatus(userId, newChatStatus);
  }

  @Delete('exit-room/:roomid')
  exitChatRoom(@ExtractId() userId: number, @Param('roomid') roomId: number) {
    return this.chatService.exitChatRoom(userId, roomId);
  }
}
