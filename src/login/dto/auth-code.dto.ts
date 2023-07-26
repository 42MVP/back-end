import { IsNotEmpty, IsNumberString, Length } from 'class-validator';

export class AuthCodeDto {
  @IsNumberString()
  @Length(4)
  @IsNotEmpty()
  code: string;
}
