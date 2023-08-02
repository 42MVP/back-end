import { IsNotEmpty, IsNumber } from 'class-validator';
import { ChatUserStatus } from 'src/common/enums';

export class UpdateChatStatusDto {
  @IsNotEmpty()
  @IsNumber()
  roomId: number;

  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  status: ChatUserStatus;
}
