import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ChatRole } from '../../../common/enums';

export class ChatUserDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  avatarURL: string;

  @IsNotEmpty()
  role: ChatRole;

  abongTime: Date;

  constructor(id: number, name: string, avatarUrl: string, role: ChatRole, abongTime: Date) {
    this.id = id;
    this.name = name;
    this.avatarURL = avatarUrl;
    this.role = role;
    this.abongTime = abongTime;
  }
}
