import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatUserDto } from './dto/request/create-chat-user.dto';
import { UpdateChatUserDto } from './dto/request/update-chat-user.dto';
import { UpdateChatRoomDto } from './dto/request/update-chat-room.dto';
import { CreateChatRoomDto } from './dto/request/create-chat-room.dto';
import { ExitChatRoomDto } from './dto/request/exit-chat-room.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('search')
  findAllChannel() {
    return this.chatService.findAllChannel();
  }

  @Get(':id')
  getChatRoomList(@Param('id') id: string) {
    return this.chatService.getChatRoomList(id);
  }

  @Post('create-room')
  createChatRoom(@Body() newRoomInfo: CreateChatRoomDto) {
    return this.chatService.createChatRoom(newRoomInfo);
  }

  // TODO: enum에 이상한거 들어오는지 가드 하기
  @Post('enter-room')
  enterChatRoom(@Body() newChatUser: CreateChatUserDto) {
    return this.chatService.enterChatRoom(newChatUser);
  }

  @Post('invite')
  inviteChatUser(@Body() invitedChatUser: CreateChatUserDto) {
    return this.chatService.enterChatRoom(invitedChatUser);
  }

  @Patch('change-room-info')
  changeChatRoomInfo(@Body() changeInfo: UpdateChatRoomDto) {
    return this.chatService.changeChatRoomInfo(changeInfo);
  }

  @Patch('change-role')
  changeChatUserRole(@Body() changeChatUserInfo: UpdateChatUserDto) {
    return this.chatService.changeChatUserRole(changeChatUserInfo);
  }

  @Patch('change-status')
  changeChatUserStatus(@Body() changeChatUserInfo: UpdateChatUserDto) {
    return this.chatService.changeChatUserStatus(changeChatUserInfo);
  }

  @Delete('exit-room')
  exitChatRoom(@Body() exitInfo: ExitChatRoomDto) {
    return this.chatService.exitChatRoom(exitInfo);
  }
}
