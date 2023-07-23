import { IsNotEmpty, IsNumber } from 'class-validator';

export class ChatMessageDto {
  @IsNotEmpty()
  @IsNumber()
  roomId: number;

  @IsNotEmpty()
  userName: string;

  message: string;
}
