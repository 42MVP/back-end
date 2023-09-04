import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { GameHistory } from 'src/common/entities/game-history.entity';
import { User } from 'src/common/entities/user.entity';

export class GameHistoryDto {
  @IsNotEmpty()
  @IsNumber()
  winnerScore: number;

  @IsNotEmpty()
  @IsNumber()
  loserScore: number;

  @IsNotEmpty()
  @IsString()
  winner: string;

  @IsNotEmpty()
  @IsString()
  loser: string;

  winnerAvatarUrl: string;

  loserAvatarUrl: string;

  @IsNotEmpty()
  createAt: Date;

  @IsNotEmpty()
  @IsNumber()
  winnerRate: number;

  @IsNotEmpty()
  @IsNumber()
  loserRate: number;

  constructor(gameHistory: GameHistory, win: User, defeat: User) {
    this.winnerScore = gameHistory.winnerScore;
    this.loserScore = gameHistory.loserScore;
    this.winner = win.userName;
    this.loser = defeat.userName;
    this.winnerAvatarUrl = win.avatar;
    this.loserAvatarUrl = defeat.avatar;
    this.createAt = gameHistory.created_at;
    this.winnerRate = win.rating;
    this.loserRate = defeat.rating;
  }
}
