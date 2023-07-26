import { IsNotEmpty } from 'class-validator';
import { ChatUserStatus } from '../../../common/enums';

export class ChangedUserStatusDto {
  @IsNotEmpty()
  userName: string;

  @IsNotEmpty()
  status: ChatUserStatus;
}
