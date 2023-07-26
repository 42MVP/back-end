import { IsNotEmpty, IsOptional } from 'class-validator';
import { ChatRoom } from '../../../common/entities/chatroom.entity';
import { ChatRoomMode } from '../../../common/enums';

export class CreateChatRoomDto {
  @IsNotEmpty()
  userId: number;

  @IsOptional()
  dmId: number;

  @IsOptional()
  roomName: string;

  @IsNotEmpty()
  roomMode: ChatRoomMode;

  @IsOptional()
  password: string;

  public toChatRoomEntity() {
    return ChatRoom.from(this.roomName, this.roomMode, this.password);
  }
}
