import { IsNotEmpty, IsNumber } from 'class-validator';

export class FollowDto {
  @IsNumber()
  @IsNotEmpty()
  from: number;

  @IsNumber()
  @IsNotEmpty()
  to: number;
}
