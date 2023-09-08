import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameHistory } from '../common/entities/game-history.entity';
import { Repository } from 'typeorm';
import { User } from 'src/common/entities/user.entity';
import { Game } from 'src/game/game';
import { GameHistoryDto } from './dto/game-history.dto';

@Injectable()
export class GameHistoryService {
  constructor(
    @InjectRepository(GameHistory)
    private gameHistoryRepository: Repository<GameHistory>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // async createGameHistory(winnerId: number, loserId: number, winnerScore: number, loserScore: number): Promise<void> {
  //   const gameHistory: GameHistory = new GameHistory(winnerId, loserId, winnerScore, loserScore);
  //   await this.gameHistoryRepository.save(gameHistory);
  // }

  async updateGameHistory(game: Game): Promise<number> {
    const win: User = await this.userRepository.findOne({ where: { id: game.resultInfo.win.userId } });
    const defeat: User = await this.userRepository.findOne({ where: { id: game.resultInfo.defeat.userId } });
    await this.userRepository.update({ id: win.id }, { winNum: win.winNum + 1 });
    await this.userRepository.update({ id: defeat.id }, { loseNum: defeat.loseNum + 1 });
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

  async getGameHistory(id: number): Promise<GameHistory[]> {
    return await this.gameHistoryRepository.find({
      where: [{ winnerId: id }, { loserId: id }],
    });
  }

  async sendGameHistory(userId: number, gameHistoryId: number) {
    const targetRecord: GameHistory = await this.gameHistoryRepository.findOne({ where: { id: gameHistoryId } });
    if (targetRecord.winnerId !== userId || targetRecord.loserId !== userId)
      new ForbiddenException('The user has no permission to access target game history');
    const win: User = await this.userRepository.findOne({ where: { id: targetRecord.winnerId } });
    const defeat: User = await this.userRepository.findOne({ where: { id: targetRecord.loserId } });
    return new GameHistoryDto(targetRecord, win, defeat);
  }
}
