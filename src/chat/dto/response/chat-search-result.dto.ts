import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ChatSearchResultDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsBoolean()
  hasPassword: boolean;

  constructor(id: number, name: string, hasPassword: boolean) {
    this.id = id;
    this.name = name;
    this.hasPassword = hasPassword;
  }
}
