import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class EnterChatRoomDto {
  @IsNotEmpty()
  @IsNumber()
  roomId: number;

  @IsOptional()
  password: string;
}
