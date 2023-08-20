import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { Matching, MatchingRepository } from 'src/repository/matching.repository';
import { QueueRepository, rating, userId } from 'src/repository/queue.repository';
import { GameInvitationGateway } from './invitation/game-invitation.gateway';
import { GameMatchingGateway } from './matching/game-matching.gateway';
import { Invitation, InvitationRepository } from 'src/repository/invitation.repository';

@Injectable()
export class GameIntervalService {
  constructor(
    private readonly queueRepository: QueueRepository,
    private readonly matchingRepository: MatchingRepository,
    private readonly invitationRepository: InvitationRepository,
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
    const matchingId: number = this.matchingRepository.save([user1Id, user2Id]);
    this.gameMatchingGateway.sendMatching(user1Id, matchingId);
    this.gameMatchingGateway.sendMatching(user2Id, matchingId);
  }

  removeExpiredMatching(): void {
    const expiredMatches = this.getExpiredMatches();

    expiredMatches.forEach((e: Matching) => {
      this.gameMatchingGateway.sendMatchingTimeout(e.matchingId, e.challengers[0], e.challengers[1]);
      this.matchingRepository.delete(e.matchingId);
    });
    return;
  }

  getExpiredMatches(): Array<Matching> {
    const MATCHING_TIMEOUT_MS = 15000;
    const matchings: Array<Matching> = this.matchingRepository.findAll().toArray();

    console.log('matchings: ', matchings);
    return matchings.filter(e => {
      if (new Date().getTime() - e.time.getTime() > MATCHING_TIMEOUT_MS) return true;
      return false;
    });
  }

  removeExpiredInvitation(): void {
    const INVITATION_TIMEOUT_MS = 10000;
    const invitations: Map<number, Invitation> = this.invitationRepository.findAll();

    console.log('invitation: ', invitations);
    invitations.forEach((value: Invitation, key: number) => {
      if (new Date().getTime() - value.time.getTime() > INVITATION_TIMEOUT_MS) {
        this.gameInvitationGateway.sendInviteTimeout(value);
        this.invitationRepository.delete(key);
      }
    });
  }
}
