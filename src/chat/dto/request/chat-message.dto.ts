import { IsNotEmpty, IsNumber } from 'class-validator';

export class ChatMessageDto {
  @IsNotEmpty()
  @IsNumber()
  roomId: number;

  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  userName: string;

  @IsNotEmpty()
  avatarURL: string;

  message: string;
}
