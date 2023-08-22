import { GameHistory } from 'src/common/entities/game-history.entity';

export class GameHistoryResponseDto {
  constructor(gameHistory: GameHistory, id: number) {
    if (id == gameHistory.winnerId) {
      this.score = gameHistory.winnerScore;
      this.opponentScore = gameHistory.loserScore;
      this.opponentName = gameHistory.loser.userName;
      this.opponentAvatarURL = gameHistory.loser.avatar;
    } else {
      this.score = gameHistory.loserScore;
      this.opponentScore = gameHistory.winnerScore;
      this.opponentName = gameHistory.winner.userName;
      this.opponentAvatarURL = gameHistory.winner.avatar;
    }
    this.createdAt = gameHistory.created_at;
  }

  score: number;
  opponentScore: number;
  opponentName: string;
  opponentAvatarURL: string;
  createdAt: Date;
}
