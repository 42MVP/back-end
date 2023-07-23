import { IsNotEmpty, IsNumber } from 'class-validator';
import { ChatRole, ChatUserStatus } from '../../database/entities/enums';
import { ChatUser } from 'src/database/entities/chatuser.entity';

export class CreateChatUserDto {
  @IsNotEmpty()
  @IsNumber()
  roomId: number;

  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  status: ChatUserStatus;

  @IsNotEmpty()
  role: ChatRole;

  muteTime: Date;

  public toChatUserEntity() {
    return ChatUser.from(this.roomId, this.userId, this.status, this.role, this.muteTime);
  }
}
