import { IsNotEmpty, IsNumber } from 'class-validator';

export class ChatMessageDto {
  @IsNotEmpty()
  @IsNumber()
  roomId: string;

  @IsNotEmpty()
  userName: string;

  message: string;
}
