import { Injectable } from '@nestjs/common';

export enum UserState {
  UNAVAIABLE = undefined,
  IDLE = 0,
  IN_QUEUE = 1,
  IN_MATCHING = 2,
  IN_INVITATION = 3,
  IN_GAME = 4,
}

export enum UserStateString {
  ONLINE = '온라인',
  OFFLINE = '오프라인',
  FIND_GAME = '게임 찾는중',
  IN_GAME = '게임중',
}

export const userStateToString = (state: UserState) => {
  switch (state) {
    case UserState.IDLE:
      return UserStateString.ONLINE;
    case UserState.IN_QUEUE:
    case UserState.IN_MATCHING:
    case UserState.IN_INVITATION:
      return UserStateString.FIND_GAME;
    case UserState.IN_GAME:
      return UserStateString.IN_GAME;
  }
  return UserStateString.OFFLINE;
};

export abstract class Observer {
  public abstract update(): void;
}

export abstract class Subject {
  public abstract registerObserver(observer: Observer): void;
  public abstract removeObserver(observer: Observer): void;
  public abstract notifyObservers(): void;
}

@Injectable()
export class UserStateRepository extends Subject {
  private readonly userStateMap: Map<number, UserState>;
  private observers: Observer[] = [];
  private changedUser: { id: number; state: UserState };

  constructor() {
    super();
    this.userStateMap = new Map<number, UserState>();
  }

  find(userId: number): UserState | undefined {
    return this.userStateMap.get(userId);
  }

  private userUpdate(userId: number, userState: UserState): void {
    this.changedUser = { id: userId, state: userState };
    this.notifyObservers();
  }

  public getResentChangedUser(): { id: number; state: UserState } {
    return this.changedUser;
  }

  save(userId: number, userState: UserState): void {
    this.userStateMap.set(userId, userState);
    this.userUpdate(userId, userState);
    return;
  }

  update(userId: number, userState: UserState): boolean {
    if (this.userStateMap.get(userId) === undefined) {
      return false;
    } else {
      this.userStateMap.set(userId, userState);
      this.userUpdate(userId, userState);
      return true;
    }
  }

  delete(userId: number): boolean {
    const ret = this.userStateMap.delete(userId);
    if (ret) this.userUpdate(userId, UserState.UNAVAIABLE);
    return ret;
  }

  registerObserver(observer: Observer): void {
    this.observers.push(observer);
  }

  removeObserver(observer: Observer): void {
    for (let i = 0; i < this.observers.length; i++) {
      if (this.observers[i] === observer) {
        this.observers.splice(i, 1);
        break;
      }
    }
  }

  notifyObservers(): void {
    for (let i = 0; i < this.observers.length; i++) {
      this.observers[i].update();
    }
  }
}
