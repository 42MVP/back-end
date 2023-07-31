import { IsOptional } from 'class-validator';
import { EnterChatRoomDto } from './enter-chat-room.dto';
import { ChatRoomMode } from 'src/common/enums';

export class ChangeChatRoomDto extends EnterChatRoomDto {
  @IsOptional()
  roomMode: ChatRoomMode;
}
