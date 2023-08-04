import { IsBoolean, IsNotEmpty, IsNumber } from 'class-validator';
import { ChatUserDto } from './chat-user.dto';
import { ChatRoomMode } from 'src/common/enums';

export class ChatRoomDataDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  name: string;

  @IsNotEmpty()
  @IsBoolean()
  isChannel: boolean;

  @IsNotEmpty()
  roomMode: ChatRoomMode;

  @IsNotEmpty()
  self: ChatUserDto;

  users: ChatUserDto[];

  banUsers: ChatUserDto[];

  constructor(
    id: number,
    name: string,
    isChannel: boolean,
    roomMode: ChatRoomMode,
    self: ChatUserDto,
    users: ChatUserDto[],
    banUsers: ChatUserDto[],
  ) {
    this.id = id;
    this.name = name;
    this.isChannel = isChannel;
    this.roomMode = roomMode;
    this.self = self;
    this.users = users;
    this.banUsers = banUsers;
  }
}
