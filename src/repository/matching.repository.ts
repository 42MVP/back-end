import { Injectable } from '@nestjs/common';

export interface Matching {
  user1Id: number;
  user2Id: number;
  accept: boolean;
  time: Date;
}

@Injectable()
export class MatchingRepository {
  private index: number;
  private readonly matchingMap: Map<number, Matching>;

  constructor() {
    this.index = 0;
    this.matchingMap = new Map<number, Matching>();
  }

  find(matchingId: number): Matching | undefined {
    return this.matchingMap.get(matchingId);
  }

  findAll(): Map<number, Matching> {
    return this.matchingMap;
  }

  save(user1Id: number, user2Id: number): number {
    const curIndex = this.index;
    this.matchingMap.set(curIndex, {
      user1Id: user1Id,
      user2Id: user2Id,
      accept: false,
      time: new Date(),
    });
    this.index++;

    return curIndex;
  }

  update(matchingId: number, matching: Matching): void {
    this.matchingMap.set(matchingId, matching);
  }

  delete(matchingId: number): boolean {
    return this.matchingMap.delete(matchingId);
  }
}
