import { Injectable } from '@nestjs/common';

export type matchingId = number;
export type userId = number;
export type challengers = Record<userId, userId>;

export interface Matching {
  matchingId: number;
  challengers: Record<userId, userId>;
  accept: boolean;
  time: Date;
}

export class MatchingArray {
  private index: number;
  private matchings: Array<Matching>;

  constructor() {
    this.index = 0;
    this.matchings = new Array();
  }

  private get(key: matchingId): Matching | undefined {
    return this.matchings.find(e => e.matchingId === key);
  }

  private set(element: Matching) {
    this.matchings.push(element);
  }

  toArray(): Array<Matching> {
    return this.matchings;
  }

  delete(key: matchingId) {
    this.matchings = this.matchings.filter(e => e.matchingId !== key);
  }

  find(key: matchingId): Matching | undefined {
    return this.matchings.find((e: Matching) => e.matchingId === key);
  }

  private findIndex(key: matchingId) {
    return this.matchings.findIndex((e: Matching) => e.matchingId === key);
  }

  update(matching: Matching) {
    const index = this.findIndex(matching.matchingId);
    if (index === -1) return;
    this.matchings[index] = matching;
  }

  save(ids: challengers): matchingId {
    const curIndex = this.index;
    this.set({ matchingId: this.index, challengers: ids, accept: false, time: new Date() });
    this.index++;

    return curIndex;
  }
}

@Injectable()
export class MatchingRepository {
  private readonly matchingArray: MatchingArray;

  constructor() {
    this.matchingArray = new MatchingArray();
  }

  find(matchingId: matchingId): Matching | undefined {
    return this.matchingArray.find(matchingId);
  }

  findAll(): MatchingArray {
    return this.matchingArray;
  }

  save(challengersId: Record<userId, userId>): number {
    return this.matchingArray.save(challengersId);
  }

  update(matching: Matching) {
    this.matchingArray.update(matching);
  }

  delete(id: matchingId): void {
    return this.matchingArray.delete(id);
  }
}
