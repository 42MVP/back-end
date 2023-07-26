import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameHistory } from 'src/common/entities/game-history.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GameHistoryService {
  constructor(
    @InjectRepository(GameHistory)
    private gameHistoryRepository: Repository<GameHistory>,
  ) {}

  async createGameHistory(winnerId: number, loserId: number, winnerScore: number, loserScore: number): Promise<void> {
    const gameHistory: GameHistory = new GameHistory(winnerId, loserId, winnerScore, loserScore);
    await this.gameHistoryRepository.save(gameHistory);
  }

  async getGameHistry(id: number): Promise<GameHistory[]> {
    return await this.gameHistoryRepository.find({
      where: [{ winnerId: id }, { loserId: id }],
    });
  }
}
