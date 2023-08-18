import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { Matching, MatchingRepository } from 'src/repository/matching.repository';
import { QueueRepository, rating, userId } from 'src/repository/queue.repository';
import { GameMatchingGateway } from './game-matching.gateway';

@Injectable()
export class QueueService {
  constructor(
    private readonly queueRepository: QueueRepository,
    private readonly matchingRepository: MatchingRepository,
    private readonly gameMatchingGateway: GameMatchingGateway,
  ) {}

  private MAX_RATING_GAP: number = 100;

  @Interval(3000)
  async queueLoop() {
    this.queueLogic(this.MAX_RATING_GAP);
  }

  async queueLogic(maxRatingGap: number): Promise<void> {
    const queue: Map<rating, userId> = this.queueRepository.findAll();
    let beforeUser: Record<number, number> = undefined;

    console.log('queue:', queue);

    for (const [userId, rating] of queue) {
      if (beforeUser === undefined) {
        beforeUser = [rating, userId];
        continue;
      }
      const beforeUserRating = beforeUser[0];
      const beforeUserId = beforeUser[1];
      console.log('Matched=================================');
      console.log(`User1: rating: ${rating}, VALUE: ${userId}`);
      console.log(`User2: rating: ${beforeUserRating}, VALUE: ${beforeUserId}`);
      this.queueRepository.delete(userId);
      this.queueRepository.delete(beforeUserId);
      const matchingId: number = this.matchingRepository.save([userId, beforeUserId]);
      const isSended = this.gameMatchingGateway.sendMatched([userId, beforeUserId], matchingId);
      if (isSended === false) {
        this.matchingRepository.delete(matchingId);
        this.gameMatchingGateway.sendMatchingError(matchingId);
      }
      beforeUser = [userId, rating];
    }
  }

  @Interval(1000)
  async matchingLoop() {
    const matchings: Array<Matching> = this.matchingRepository.findAll().toArray();
    const expiredMatches: Array<Matching> = matchings.filter(e => {
      if (new Date().getTime() - e.time.getTime() > 15000) return true;
      return false;
    });
    expiredMatches.forEach((e: Matching) => {
      this.matchingRepository.delete(e.matchingId);
      this.gameMatchingGateway.sendTimeout(e.matchingId, e.challengers[0], e.challengers[1]);
    });
  }
}
