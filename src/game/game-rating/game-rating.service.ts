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

  getNewRating(oldRating: number, expectedScore: number, isWin: boolean) {
    return isWin
      ? Math.round(oldRating + this.k * (1 - expectedScore))
      : Math.round(oldRating + this.k * (0 - expectedScore));
  }

  async updateGameRating(game: Game) {
    console.log('=================');
    const winExpected = this.getExpectedScore(game.resultInfo.win.rating, game.resultInfo.defeat.rating);
    console.log('||||||||| EXPECTED SCORE (WIN): ', winExpected);
    const defeatExpected = this.getExpectedScore(game.resultInfo.defeat.rating, game.resultInfo.win.rating);
    console.log('||||||||| EXPECTED SCORE (DEFEAT): ', defeatExpected);

    console.log('>>>>>>> BEFORE RATING (WIN): ', game.resultInfo.win.rating);
    console.log('>>>>>>> BEFORE RATING (DEFEAT): ', game.resultInfo.defeat.rating);
    console.log(`>>>>>>> Rating for win: ${this.getNewRating(game.resultInfo.win.rating, winExpected, true)}`);
    console.log(
      `>>>>>>> Rating for defeat: ${this.getNewRating(game.resultInfo.defeat.rating, defeatExpected, false)}`,
    );
    console.log('=================');
    await this.userRepository.update(
      { id: game.resultInfo.win.userId },
      { rating: this.getNewRating(game.resultInfo.win.rating, winExpected, true) },
    );
    await this.userRepository.update(
      { id: game.resultInfo.defeat.userId },
      { rating: this.getNewRating(game.resultInfo.defeat.rating, defeatExpected, false) },
    );
  }
}
