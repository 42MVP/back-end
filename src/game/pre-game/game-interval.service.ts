import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { Matching, MatchingAcceptUser, MatchingRepository } from 'src/repository/matching.repository';
import { QueueRepository, rating, userId } from 'src/repository/queue.repository';
import { GameInvitationGateway } from './invitation/game-invitation.gateway';
import { GameMatchingGateway } from './matching/game-matching.gateway';
import { Invitation, InvitationRepository } from 'src/repository/invitation.repository';
import { UserState, UserStateRepository } from 'src/repository/user-state.repository';

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
    const queue: Map<rating, userId> = this.queueRepository.findAll();
    let user2: Record<number, number> = undefined;

    console.log('queue: ', queue);

    for (const [userId, rating] of queue) {
      if (user2 === undefined) {
        user2 = [userId, rating];
        continue;
      }
      const user2Id = user2[0];
      const user2Rating = user2[1];

      if (this.isMatchSuitable()) this.makeMatching(userId, user2Id);
      user2 = [userId, rating];
    }
  }

  isMatchSuitable(): boolean {
    return true;
  }

  makeMatching(user1Id: number, user2Id: number): void {
    console.log(`Matched==========`);
    console.log(`User1: ${user1Id}`);
    console.log(`User2: ${user2Id}`);

    this.queueRepository.delete(user1Id);
    this.queueRepository.delete(user2Id);
    this.userStateRepository.update(user1Id, UserState.IN_MATCHING);
    this.userStateRepository.update(user2Id, UserState.IN_MATCHING);
    const matchingId: number = this.matchingRepository.save(user1Id, user2Id);
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
      }
      this.matchingRepository.delete(key);
      this.userStateRepository.update(value.user1Id, UserState.IDLE);
      this.userStateRepository.update(value.user2Id, UserState.IDLE);
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
