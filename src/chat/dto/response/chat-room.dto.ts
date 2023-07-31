import { IsNotEmpty, IsNumber } from 'class-validator';
import { ChatRoomMode } from 'src/common/enums';

export class ChatRoomDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  name: string;

  @IsNotEmpty()
  roomMode: ChatRoomMode;

  constructor(id: number, name: string, roomMode: ChatRoomMode) {
    this.id = id;
    this.name = name;
    this.roomMode = roomMode;
  }
}
