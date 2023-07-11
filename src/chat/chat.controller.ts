import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatRoomDto } from './dto/create-chat-room.dto';
import { CreateChatUserDto } from './dto/create-chat-user.dto';
import { UpdateChatUserDto } from './dto/update-chat-user.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':id')
  getChatRoomList(@Param('id') id: string) {
    return this.chatService.getChatRoomList(id);
  }

  // doxygen 작성!! 제발!@
  @Post('enter-room')
  enterChatRoom(@Body() createChatUserDto: CreateChatUserDto) {
    // 있는 채팅방 들어감
    return this.chatService.enterChatRoom(createChatUserDto);
  }

  @Post('create-room')
  createChatRoom(@Query('userid') userId: number, @Body() createChatRoomDto: CreateChatRoomDto) {
    return this.chatService.createChatRoom(userId, createChatRoomDto);
  }

  @Get()
  findAll() {
    return this.chatService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chatService.findOne(+id);
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
