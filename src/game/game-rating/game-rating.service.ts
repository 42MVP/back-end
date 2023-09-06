import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/common/entities/user.entity';
import { Repository } from 'typeorm';
import { Game } from '../game';

@Injectable()
export class GameRatingService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private k = 42;

  getExpectedScore(rating1: number, rating2: number): number {
    return (1.0 * 1.0) / (1 + 1.0 * Math.pow(10, (1.0 * (rating1 - rating2)) / 400));
  }

  async updateGameRating(game: Game) {
    const winExpected = this.getExpectedScore(game.resultInfo.win.rating, game.resultInfo.defeat.rating);
    const defeatExpected = this.getExpectedScore(game.resultInfo.defeat.rating, game.resultInfo.win.rating);

    game.resultInfo.win.rating = Math.round(game.resultInfo.win.rating + this.k * (1 - winExpected));
    game.resultInfo.defeat.rating = Math.round(game.resultInfo.defeat.rating + this.k * (0 - defeatExpected));
    await this.userRepository.update({ id: game.resultInfo.win.userId }, { rating: game.resultInfo.win.rating });
    await this.userRepository.update({ id: game.resultInfo.defeat.userId }, { rating: game.resultInfo.defeat.rating });
  }
}
