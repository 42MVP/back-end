import { IsNotEmpty } from 'class-validator';
import { ChatRole } from 'src/common/enums';

export class ChangedUserRoleDto {
  @IsNotEmpty()
  userName: string;

  @IsNotEmpty()
  changedRole: ChatRole;
}
