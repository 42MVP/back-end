import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ChatRole, ChatUserStatus } from '../../../common/enums';
import { Type } from 'class-transformer';
import { ChatUser } from '../../../common/entities/chatuser.entity';

export class CreateChatUserDto {
  @IsNotEmpty()
  @IsNumber()
  roomId: number;

  roomPassword: string;

  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  status: ChatUserStatus;

  @IsNotEmpty()
  role: ChatRole;

  @IsOptional()
  @Type(() => Date)
  muteTime: Date;

  public toChatUserEntity() {
    return ChatUser.from(this.roomId, this.userId, this.status, this.role, this.muteTime);
  }
}
