import { IsNotEmpty } from 'class-validator';
import { ChatRoomMode } from '../../../database/entities/enums';
import { ChatRoom } from '../../../database/entities/chatroom.entity';

export class CreateChatRoomDto {
  @IsNotEmpty()
  userId: number;

  dmId: number;

  roomName: string;

  @IsNotEmpty()
  roomMode: ChatRoomMode;

  password: string;

  public toChatRoomEntity() {
    return ChatRoom.from(this.roomName, this.roomMode, this.password);
  }
}
