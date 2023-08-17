import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameHistory } from '../common/entities/game-history.entity';
import { Repository } from 'typeorm';
import { User } from 'src/common/entities/user.entity';

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

  // async getOpponentInfo(id: number): Promise<User[]> {
  //   return await this.userRepository
  //     .createQueryBuilder('user')
  //     .leftJoinAndSelect(GameHistory, 'game_history', 'game_history.winner_id = :id OR game_history.loser_id = :id', {
  //       id: id,
  //     })
  //     .where('friendship.from_id = :user_id', { user_id: id })
  //     .getMany();
  // }
}
