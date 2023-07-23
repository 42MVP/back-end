import { PartialType } from '@nestjs/mapped-types';
import { CreateChatUserDto } from './create-chat-user.dto';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateChatUserDto extends PartialType(CreateChatUserDto) {
  @IsNotEmpty()
  @IsNumber()
  execUserId: number;
}
