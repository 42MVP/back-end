import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ChatRole } from '../../../database/entities/enums';

export class ChatUserDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  avatarURL: string;

  @IsNotEmpty()
  role: ChatRole;

  abongTime: Date;

  constructor(id: number, userName: string, avatarUrl: string, role: ChatRole, abongTime: Date) {
    this.id = id;
    this.username = userName;
    this.avatarURL = avatarUrl;
    this.role = role;
    this.abongTime = abongTime;
  }
}
