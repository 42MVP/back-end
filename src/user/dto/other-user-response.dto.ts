import { GameHistoryResponseDto } from 'src/game-history/dto/game-history-response.dto';
import { UserResponseBaseDto } from './user-response-base.dto';
import { User } from 'src/common/entities/user.entity';
import { AchievementResponseDto } from './achievement-response.dto';

export class OtherUserResponseDto extends UserResponseBaseDto {
  constructor(user: User, isFriend: boolean, isBlock: boolean) {
    super(user);
    this.isFollow = isFriend;
    this.isBlock = isBlock;
    this.gameHistory = user.gameHistories.map(x => new GameHistoryResponseDto(x, user.id));
    this.achievements = user.achievements.map(achievement => new AchievementResponseDto(achievement));
  }

  isFollow: boolean;
  isBlock: boolean;
  gameHistory: GameHistoryResponseDto[];
  achievements: AchievementResponseDto[];
}
