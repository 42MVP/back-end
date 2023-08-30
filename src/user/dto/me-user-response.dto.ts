import { GameHistoryResponseDto } from 'src/game-history/dto/game-history-response.dto';
import { UserResponseBaseDto } from './user-response-base.dto';
import { User } from 'src/common/entities/user.entity';
import { AchievementResponseDto } from './achievement-response.dto';

export class MeUserResponseDto extends UserResponseBaseDto {
  constructor(user: User) {
    super(user);
    this.isAuth = user.isAuth;
    this.gameHistory = user.gameHistories.map(x => new GameHistoryResponseDto(x, user.id));
    this.achievements = user.achievements.map(achievement => new AchievementResponseDto(achievement));
  }
  isAuth: boolean;
  gameHistory: GameHistoryResponseDto[];
  achievements: AchievementResponseDto[];
}
