import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameHistory } from 'src/common/entities/game-history.entity';
import { Repository } from 'typeorm';
import { GameResult } from './game';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(GameHistory)
    private gameHistoryRepository: Repository<GameHistory>,
  ) {}

  async updateGameHistory(gameResult: GameResult) {
    const newRecord: GameHistory = new GameHistory(
      gameResult.winId,
      gameResult.defeatId,
      gameResult.winScore,
      gameResult.defeatScore,
    );
    await this.gameHistoryRepository.save(newRecord);
    return;
  }
}
