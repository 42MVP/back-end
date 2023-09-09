import { Injectable } from '@nestjs/common';
import { GameMode } from 'src/game/game';

export type rating = number;
export type userId = number;

@Injectable()
export class QueueRepository {
  private readonly modeMap: Map<userId, GameMode> = new Map<userId, GameMode>();
  private readonly modeQueue: Array<Map<userId, rating>> = [];

  constructor() {
    this.modeQueue.push(new Map<userId, rating>);
    this.modeQueue.push(new Map<userId, rating>);
    this.modeQueue.push(new Map<userId, rating>);
    this.modeQueue.push(new Map<userId, rating>);
  }

  find(userId: userId): rating | undefined {
    const gameMode = this.modeMap.get(userId);
    if (gameMode === undefined) return undefined;
    return this.modeQueue[gameMode].get(userId);
  }

  findAll(): Array<Map<userId, rating>> {
    return this.modeQueue;
  }

  save(gameMode: GameMode, element: Record<userId, rating>): void {
    this.modeMap.set(element[0], gameMode);
    this.modeQueue[gameMode].set(element[0], element[1]);
    return;
  }

  update(element: Record<userId, rating>) {
    const gameMode: GameMode = this.modeMap.get(element[0]);
    return this.modeQueue[gameMode].set(element[0], element[1]);
  }

  delete(userId: userId): boolean {
    const gameMode: GameMode = this.modeMap.get(userId);
    return this.modeQueue[gameMode].delete(userId);
  }
}
