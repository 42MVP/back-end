import { IsNotEmpty, IsNumber } from 'class-validator';
import { ChatUserDto } from './chat-user.dto';
import { ChatRoomMode } from 'src/common/enums';

export class ChatRoomDataDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  name: string;

  @IsNotEmpty()
  roomMode: ChatRoomMode;

  users: ChatUserDto[];

  banUsers: ChatUserDto[];

  abong: ChatUserDto[];

  constructor(
    id: number,
    name: string,
    roomMode: ChatRoomMode,
    users: ChatUserDto[],
    banUsers: ChatUserDto[],
    abong: ChatUserDto[],
  ) {
    this.id = id;
    this.name = name;
    this.roomMode = roomMode;
    this.users = users;
    this.banUsers = banUsers;
    this.abong = abong;
  }
}
