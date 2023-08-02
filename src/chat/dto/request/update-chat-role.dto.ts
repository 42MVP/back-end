import { IsNotEmpty, IsNumber } from 'class-validator';
import { ChatRole } from 'src/common/enums';

export class UpdateChatRoleDto {
  @IsNotEmpty()
  @IsNumber()
  roomId: number;

  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  role: ChatRole;
}
