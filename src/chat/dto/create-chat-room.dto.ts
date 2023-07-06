import { IsNotEmpty } from 'class-validator';
import { ChatRoomMode } from '../../database/entities/enums';

export class CreateChatRoomDto {
  roomName: string;

  @IsNotEmpty()
  roomMode: ChatRoomMode;

  password: string;
}
