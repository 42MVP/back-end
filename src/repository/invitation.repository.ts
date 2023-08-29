import { Injectable } from '@nestjs/common';

export const INVITATION_EXPIRED_MS = 10000;

export interface Invitation {
  inviterId: number;
  inviteeId: number;
  expiredTime: number;
}

@Injectable()
export class InvitationRepository {
  private readonly invitationMap: Map<number, Invitation>;
  private index: number;

  constructor() {
    this.invitationMap = new Map<number, Invitation>();
    this.index = 0;
  }

  find(id: number): Invitation | undefined {
    return this.invitationMap.get(id);
  }

  findAll(): Map<number, Invitation> {
    return this.invitationMap;
  }

  save(users: { inviterId: number; inviteeId: number }): number {
    const ret = this.index;
    const value: Invitation = {
      inviteeId: users.inviteeId,
      inviterId: users.inviterId,
      expiredTime: new Date().getTime() + INVITATION_EXPIRED_MS,
    };
    this.invitationMap.set(this.index, value);
    this.index++;

    return ret;
  }

  update(id: number, invitation: Invitation) {
    this.invitationMap.set(id, invitation);
  }

  delete(id: number): boolean {
    return this.invitationMap.delete(id);
  }
}
