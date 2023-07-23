import { IsNotEmpty } from 'class-validator';
import { ChatRole } from '../../../database/entities/enums';

export class ChangedUserRoleDto {
  @IsNotEmpty()
  userName: string;

  @IsNotEmpty()
  changedRole: ChatRole;
}
