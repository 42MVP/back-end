import { GameHistoryResponseDto } from 'src/game-history/dto/game-history-response.dto';
import { UserResponseBaseDto } from './user-response-base.dto';
import { User } from 'src/common/entities/user.entity';

export class MeUserResponseDto extends UserResponseBaseDto {
  constructor(user: User) {
    super(user);
    this.isAuth = user.isAuth;
    this.gameHistory = user.gameHistories.map(x => new GameHistoryResponseDto(x, user.id));
  }
  isAuth: boolean;
  gameHistory: GameHistoryResponseDto[];
}
