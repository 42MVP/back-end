import { IsNotEmpty } from 'class-validator';

export class ExitChatRoomDto {
  @IsNotEmpty()
  userId: number;

  @IsNotEmpty()
  roomId: number;
}
