import { GameHistoryResponseDto } from 'src/game-history/dto/game-history-response.dto';
import { UserResponseBaseDto } from './user-response-base.dto';
import { User } from 'src/common/entities/user.entity';

export class OtherUserResponseDto extends UserResponseBaseDto {
  constructor(user: User, isFriend: boolean, isBlock: boolean) {
    super(user);
    this.isFollow = isFriend;
    this.isBlock = isBlock;
    this.gameHistory = user.gameHistories.map(x => new GameHistoryResponseDto(x, user.id));
  }

  isFollow: boolean;
  isBlock: boolean;
  gameHistory: GameHistoryResponseDto[];
}
