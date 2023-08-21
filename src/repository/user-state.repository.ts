import { Injectable } from '@nestjs/common';

export enum UserState {
  UNAVAIABLE = undefined,
  IDLE = 0,
  IN_QUEUE = 1,
  IN_MATCHING = 2,
  IN_INVITATION = 3,
  IN_GAME = 4,
}

@Injectable()
export class UserStateRepository {
  private readonly userStateMap: Map<number, UserState>;

  constructor() {
    this.userStateMap = new Map<number, UserState>();
  }

  find(userId: number): UserState | undefined {
    return this.userStateMap.get(userId);
  }

  save(userId: number, userState: UserState): void {
    this.userStateMap.set(userId, userState);
    return;
  }

  update(userId: number, userState: UserState): boolean {
    if (this.userStateMap.get(userId) === undefined) {
      return false;
    } else {
      this.userStateMap.set(userId, userState);
      return true;
    }
  }

  delete(userId: number): boolean {
    return this.userStateMap.delete(userId);
  }
}
