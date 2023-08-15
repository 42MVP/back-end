import { GameHistoryResponseDto } from 'src/game-history/dto/game-history-response.dto';

export class UserSearchResponseDto {
  name: string;
  avartarURL: string;
  isFollow: boolean;
  isBlock: boolean;
  achievements: number[];
  winNum: number;
  loseNum: number;
  rate: number;
  gameHistory: GameHistoryResponseDto[];
}
