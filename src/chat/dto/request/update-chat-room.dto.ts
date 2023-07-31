import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { newChatRoomDto } from './new-chat-room.dto';

export class UpdateChatRoomDto extends PartialType(newChatRoomDto) {
  @IsNotEmpty()
  @IsNumber()
  execUserId: number;

  @IsNotEmpty()
  @IsNumber()
  roomId: number;
}
