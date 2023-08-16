import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameHistory } from 'src/common/entities/game-history.entity';
import { User } from 'src/common/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(GameHistory)
    private gameHistoryRepository: Repository<GameHistory>,
  ) {}

  async updateGameHistory(gameResult: GameResult) {
    const newRecord: GameHistory = new GameHistory(
      gameResult.winId,
      gameResult.defeatId,
      gameResult.winValue,
      gameResult.defeatValue,
    );
    await this.gameHistoryRepository.save(newRecord);
    return;
  }
}
