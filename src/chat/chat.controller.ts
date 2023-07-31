import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { newChatRoomDto } from './dto/request/new-chat-room.dto';
import { CreateChatUserDto } from './dto/request/create-chat-user.dto';
import { UpdateChatUserDto } from './dto/request/update-chat-user.dto';
import { UpdateChatRoomDto } from './dto/request/update-chat-room.dto';
import { ExitChatRoomDto } from './dto/request/exit-chat-room.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { ExtractId } from 'src/common/decorators/extract-id.decorator';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('search')
  findAllChannel(@ExtractId() userId: number) {
    console.log(userId);
    return this.chatService.findAllChannel();
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
  enterChatRoom(@ExtractId() userId: number, @Body() newChatUser: CreateChatUserDto) {
    return this.chatService.enterChatRoom(userId, newChatUser);
  }

  @Post('invite')
  inviteChatUser(@ExtractId() userId: number, @Body() invitedChatUser: CreateChatUserDto) {
    return this.chatService.enterChatRoom(userId, invitedChatUser);
  }

  @Patch('change-room-info')
  changeChatRoomInfo(@ExtractId() userId: number, @Body() changeInfo: UpdateChatRoomDto) {
    return this.chatService.changeChatRoomInfo(userId, changeInfo);
  }

  @Patch('change-role')
  changeChatUserRole(@ExtractId() userId: number, @Body() changeChatUserInfo: UpdateChatUserDto) {
    return this.chatService.changeChatUserRole(userId, changeChatUserInfo);
  }

  @Patch('change-status')
  changeChatUserStatus(@ExtractId() userId: number, @Body() changeChatUserInfo: UpdateChatUserDto) {
    return this.chatService.changeChatUserStatus(userId, changeChatUserInfo);
  }

  @Delete('exit-room')
  exitChatRoom(@ExtractId() userId: number, @Body() exitInfo: ExitChatRoomDto) {
    return this.chatService.exitChatRoom(userId, exitInfo);
  }
}
