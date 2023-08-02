import { IsNotEmpty, IsNumber } from 'class-validator';

export class FindChatUserDto {
  @IsNotEmpty()
  @IsNumber()
  roomId: number;

  @IsNotEmpty()
  @IsNumber()
  userId: number;
}
