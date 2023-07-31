import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { EnterChatRoomDto } from './enter-chat-room.dto';

export class UpdateChatUserDto extends PartialType(EnterChatRoomDto) {
  @IsNotEmpty()
  @IsNumber()
  execUserId: number;
}
