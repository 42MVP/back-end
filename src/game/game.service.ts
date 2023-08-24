import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameHistory } from 'src/common/entities/game-history.entity';
import { Repository } from 'typeorm';
import { Game } from './game';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(GameHistory)
    private gameHistoryRepository: Repository<GameHistory>,
  ) {}

  async updateGameHistory(game: Game): Promise<number> {
    const newRecord: GameHistory = await this.gameHistoryRepository.save(
      new GameHistory(
        game.resultInfo.win.userId,
        game.resultInfo.defeat.userId,
        game.resultInfo.win === game.gameInfo.leftUser ? game.scoreInfo.leftScore : game.scoreInfo.rightScore,
        game.resultInfo.defeat === game.gameInfo.leftUser ? game.scoreInfo.leftScore : game.scoreInfo.rightScore,
      ),
    );
    return newRecord.id;
  }
}
