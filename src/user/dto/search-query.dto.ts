import { IsNotEmpty, IsString } from 'class-validator';

export class SearchQueryDto {
  @IsNotEmpty()
  @IsString()
  username: string;
}
