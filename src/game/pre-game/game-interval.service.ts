import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { Matching, MatchingAcceptUser, MatchingRepository } from 'src/repository/matching.repository';
import { QueueRepository, rating, userId } from 'src/repository/queue.repository';
import { GameInvitationGateway } from './invitation/game-invitation.gateway';
import { GameMatchingGateway } from './matching/game-matching.gateway';
import { Invitation, InvitationRepository } from 'src/repository/invitation.repository';
import { UserState, UserStateRepository } from 'src/repository/user-state.repository';
import { GameMode } from '../game';

@Injectable()
export class GameIntervalService {
  constructor(
    private readonly queueRepository: QueueRepository,
    private readonly matchingRepository: MatchingRepository,
    private readonly invitationRepository: InvitationRepository,
    private readonly userStateRepository: UserStateRepository,
    private readonly gameMatchingGateway: GameMatchingGateway,
    private readonly gameInvitationGateway: GameInvitationGateway,
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
    const queue: Array<Map<rating, userId>> = this.queueRepository.findAll();

    for (let gameMode: GameMode = GameMode.DEFAULT; gameMode < 4; gameMode++) {
      for (const [userId, rating] of queue[gameMode]) {
        if (this.isMatchSuitable({ rating, userId }, queue[gameMode], gameMode)) break;
      }
    }
  }

  isMatchSuitable(target: { rating: number; userId: number }, queue: Map<rating, userId>, gameMode: GameMode): boolean {
    let average = 0;

    for (const [userId, rating] of queue) {
      if (userId === target.userId) continue;
      const ratingDiff: number = target.rating - rating;
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
