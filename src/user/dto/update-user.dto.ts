import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsNotEmpty()
  userName: string;

  @IsBoolean()
  @IsOptional()
  isAuth: boolean;

  avatar: Buffer;
}
