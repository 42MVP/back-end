import { IsNotEmpty } from 'class-validator';
import { ChatUserStatus } from '../../../database/entities/enums';

export class ChangedUserStatusDto {
  @IsNotEmpty()
  userName: string;

  @IsNotEmpty()
  status: ChatUserStatus;
}
