import { PartialType } from '@nestjs/mapped-types';
import { CreateChatRoomDto } from './create-chat-room.dto';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateChatRoomDto extends PartialType(CreateChatRoomDto) {
  @IsNotEmpty()
  @IsNumber()
  execUserId: number;

  @IsNotEmpty()
  @IsNumber()
  roomId: number;
}
