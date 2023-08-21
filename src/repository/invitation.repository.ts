import { Injectable } from '@nestjs/common';

export interface Invitation {
  inviterId: number;
  inviteeId: number;
  time: Date;
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

  save(invitation: Invitation): number {
    const ret = this.index;
    this.invitationMap.set(this.index, invitation);
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
