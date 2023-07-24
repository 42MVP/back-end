import { IsBoolean, IsNotEmpty, IsNumber } from 'class-validator';
import { ChatUserDto } from './chat-user.dto';

export class ChatRoomDataDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  @IsBoolean()
  isChannel: boolean;

  name: string;

  @IsNotEmpty()
  @IsBoolean()
  hasPassword: boolean;

  users: ChatUserDto[];

  banUsers: ChatUserDto[];

  abong: ChatUserDto[];

  constructor(
    id: number,
    isChannel: boolean,
    name: string,
    hasPassword: boolean,
    users: ChatUserDto[],
    banUsers: ChatUserDto[],
    abong: ChatUserDto[],
  ) {
    this.id = id;
    this.isChannel = isChannel;
    this.name = name;
    this.hasPassword = hasPassword;
    this.users = users;
    this.banUsers = banUsers;
    this.abong = abong;
  }
}
