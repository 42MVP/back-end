import { PartialType } from '@nestjs/mapped-types';
import { GameHistoryResponseDto } from 'src/game-history/dto/game-history-response.dto';
import { UserResponseBaseDto } from './user-response-base.dto';
import { User } from 'src/common/entities/user.entity';

export class MeUserResponseDto extends UserResponseBaseDto {
  constructor(user: User) {
    super(user);
    this.isAuth = user.isAuth;
  }
  isAuth: boolean;
  gameHistory: GameHistoryResponseDto[];
}
