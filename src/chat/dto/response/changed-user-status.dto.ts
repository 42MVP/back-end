import { IsNotEmpty } from 'class-validator';
import { ChatUserStatus } from '../../../common/enums';

export class ChangedUserStatusDto {
  @IsNotEmpty()
  userName: string;

  @IsNotEmpty()
  status: ChatUserStatus;

  constructor(userName: string, status: ChatUserStatus) {
    this.userName = userName;
    this.status = status;
  }
}
