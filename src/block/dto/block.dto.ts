import { IsNotEmpty, IsNumber } from 'class-validator';

export class BlockDto {
  @IsNumber()
  @IsNotEmpty()
  from: number;

  @IsNumber()
  @IsNotEmpty()
  to: number;
}
