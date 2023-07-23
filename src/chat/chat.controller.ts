import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatUserDto } from './dto/create-chat-user.dto';
import { UpdateChatUserDto } from './dto/update-chat-user.dto';
import { UpdateChatRoomDto } from './dto/update-chat-room.dto';
import { CreateRoomDto } from './dto/create-room.dto';

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
  createChatRoom(@Body() newRoomInfo: CreateRoomDto) {
    return this.chatService.createChatRoom(newRoomInfo);
  }

  // doxygen 작성!! 제발!@
  @Post('enter-room')
  enterChatRoom(@Body() newChatUser: CreateChatUserDto) {
    // 있는 채팅방 들어감
    return this.chatService.enterChatRoom(newChatUser);
  }

  @Post('invite')
  inviteChatUser(@Body() invitedChatUser: CreateChatUserDto) {
    return this.chatService.enterChatRoom(invitedChatUser);
  }

  @Patch('change-room-info')
  changeChatRoomInfo(
    @Query('execid') execId: number,
    @Query('roomid') roomId: number,
    @Body() updateChatRoomDto: UpdateChatRoomDto,
  ) {
    return this.chatService.changeChatRoomInfo(execId, roomId, updateChatRoomDto);
  }

  @Patch('change-role')
  changeChatUserRole(@Query('execid') execUserId: number, @Body() updateChatUserDto: UpdateChatUserDto) {
    return this.chatService.changeChatUserRole(execUserId, updateChatUserDto);
  }

  @Patch('change-status')
  changeChatUserStatus(@Query('execid') execUserId: number, @Body() updateChatUserDto: UpdateChatUserDto) {
    return this.chatService.changeChatUserStatus(execUserId, updateChatUserDto);
  }

  @Delete('exit-room')
  exitChatRoom(@Query('userid') userId: number, @Query('roomid') roomId: number) {
    return this.chatService.exitChatRoom(userId, roomId);
  }
}
