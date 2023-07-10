import { IsNotEmpty, IsNumber } from 'class-validator';
import { ChatRole, ChatUserStatus } from '../../database/entities/enums';

export class CreateChatUserDto {
  @IsNotEmpty()
  @IsNumber()
  roomId: number;

  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  status: ChatUserStatus;

  @IsNotEmpty()
  role: ChatRole;

  muteTime: Date;
}
