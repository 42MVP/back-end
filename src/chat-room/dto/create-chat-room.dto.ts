import { IsNotEmpty } from 'class-validator';
import { ChatRoomMode } from 'src/database/entities/enums';

export class CreateChatRoomDto {
  @IsNotEmpty()
  roomMode: ChatRoomMode;

  password: string;
}
