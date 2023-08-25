import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameHistory } from 'src/common/entities/game-history.entity';
import { Repository } from 'typeorm';
import { Game } from './game';
import { GameHistoryDto } from './dto/game-history.dto';
import { User } from 'src/common/entities/user.entity';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(GameHistory)
    private readonly gameHistoryRepository: Repository<GameHistory>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

  async getGameHistory(userId: number, gameHistoryId: number) {
    const targetRecord: GameHistory = await this.gameHistoryRepository.findOne({ where: { id: gameHistoryId } });
    if (targetRecord.winnerId !== userId || targetRecord.loserId !== userId)
      new ForbiddenException('The user has no permission to access target game history');
    const win: User = await this.userRepository.findOne({ where: { id: targetRecord.winnerId } });
    const defeat: User = await this.userRepository.findOne({ where: { id: targetRecord.loserId } });
    return new GameHistoryDto(targetRecord, win, defeat);
  }
}
