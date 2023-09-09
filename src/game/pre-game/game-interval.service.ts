import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { Matching, MatchingAcceptUser, MatchingRepository } from 'src/repository/matching.repository';
import { QueueRepository, rating, userId } from 'src/repository/queue.repository';
import { GameInvitationGateway } from './invitation/game-invitation.gateway';
import { GameMatchingGateway } from './matching/game-matching.gateway';
import { Invitation, InvitationRepository } from 'src/repository/invitation.repository';
import { UserState, UserStateRepository } from 'src/repository/user-state.repository';
import { GameMode } from '../game';
import { GameRatingService } from '../game-rating/game-rating.service';

@Injectable()
export class GameIntervalService {
  constructor(
    private readonly queueRepository: QueueRepository,
    private readonly matchingRepository: MatchingRepository,
    private readonly invitationRepository: InvitationRepository,
    private readonly userStateRepository: UserStateRepository,
    private readonly gameMatchingGateway: GameMatchingGateway,
    private readonly gameInvitationGateway: GameInvitationGateway,
    private readonly gameRatingService: GameRatingService,
  ) {}

  @Interval(5000)
  loop(): void {
    console.log(`Interval============`);
    this.matchMaking();
    this.removeExpiredMatching();
    this.removeExpiredInvitation();

    return;
  }

  matchMaking(): void {
    const queue: Map<rating, userId>[] = this.queueRepository.findAll();

    console.log('queue: ', queue);

    let gameMode: GameMode = GameMode.DEFAULT;
    for (const modeQueue of queue) {
      for (const [userId, rating] of modeQueue) {
        console.log('IN MODE [', gameMode, '] QUEUE: target Rate: ', rating, 'id: ', userId);
        if (this.isMatchSuitable({ rating, userId }, modeQueue, gameMode)) break;
      }
      gameMode++;
    }
    // const queue: Map<rating, userId> = this.queueRepository.findAll(GameMode.MODE_ONE);
    // const queue2: Map<rating, userId> = this.queueRepository.findAll(GameMode.MODE_TWO);
    // // let user2: Record<number, number> = undefined;

    // for (const [userId, rating] of queue) {
    //   if (this.isMatchSuitable({ rating, userId }, queue, GameMode.MODE_ONE)) break;
    // }

    // for (const [userId, rating] of queue2) {
    //   console.log('IN MODE TWO QUEUE: target Rate: ', rating, 'id: ', userId);
    //   if (this.isMatchSuitable({ rating, userId }, queue2, GameMode.MODE_TWO)) break;
    // }
  }

  isMatchSuitable(target: { rating: number; userId: number }, queue: Map<rating, userId>, gameMode: GameMode): boolean {
    let average = 0;

    for (const [userId, rating] of queue) {
      if (userId === target.userId) continue;
      const ratingDiff: number = target.rating - rating;
      console.log('>>>>>>>>>>>>>>> rating Diff: ', ratingDiff);
      if (Math.abs(ratingDiff) <= 200) {
        this.makeMatching(userId, target.userId, gameMode);
        return true;
      }
      average += ratingDiff;
    }

    if (queue.size > 1) {
      average = average / (queue.size - 1);
      this.queueRepository.update([target.userId, target.rating - Math.round(average * 0.1)]);
    }
    return false;
  }

  makeMatching(user1Id: number, user2Id: number, gameMode: GameMode): void {
    console.log(`Matched==========`);
    console.log(`User1: ${user1Id}`);
    console.log(`User2: ${user2Id}`);

    this.queueRepository.delete(user1Id);
    this.queueRepository.delete(user2Id);
    this.userStateRepository.update(user1Id, UserState.IN_MATCHING);
    this.userStateRepository.update(user2Id, UserState.IN_MATCHING);
    const matchingId: number = this.matchingRepository.save(gameMode, user1Id, user2Id);
    const matching: Matching = this.matchingRepository.find(matchingId);
    this.gameMatchingGateway.sendMatching(user1Id, {
      matchingId: matchingId,
      endTimeMs: matching.expiredTime,
    });
    this.gameMatchingGateway.sendMatching(user2Id, {
      matchingId: matchingId,
      endTimeMs: matching.expiredTime,
    });
  }

  removeExpiredMatching(): void {
    const matchings: Map<number, Matching> = this.matchingRepository.findAll();

    console.log('matchings: ', matchings);

    matchings.forEach((value: Matching, key: number) => {
      if (new Date().getTime() > value.expiredTime) {
        if (value.accept === MatchingAcceptUser.NONE) {
          this.gameMatchingGateway.sendMatchingTimeout(value.user1Id);
          this.gameMatchingGateway.sendMatchingTimeout(value.user2Id);
        } else if (value.accept === MatchingAcceptUser.USER_1) {
          this.gameMatchingGateway.sendMatchingTimeout(value.user2Id);
          this.gameMatchingGateway.sendMatchingRejected(value.user1Id);
        } else {
          this.gameMatchingGateway.sendMatchingTimeout(value.user1Id);
          this.gameMatchingGateway.sendMatchingRejected(value.user2Id);
        }
        this.matchingRepository.delete(key);
        this.userStateRepository.update(value.user1Id, UserState.IDLE);
        this.userStateRepository.update(value.user2Id, UserState.IDLE);
      }
    });
  }

  removeExpiredInvitation(): void {
    const invitations: Map<number, Invitation> = this.invitationRepository.findAll();

    console.log('invitation: ', invitations);
    invitations.forEach((value: Invitation, key: number) => {
      if (new Date().getTime() > value.expiredTime) {
        this.gameInvitationGateway.sendInviteTimeout(value);
        this.invitationRepository.delete(key);
        this.userStateRepository.update(value.inviteeId, UserState.IDLE);
        this.userStateRepository.update(value.inviterId, UserState.IDLE);
      }
    });
  }
}
