import { Injectable } from '@nestjs/common';
import { GameMode } from 'src/game/game';

export type rating = number;
export type userId = number;

@Injectable()
export class QueueRepository {
  private readonly modeMap: Map<userId, GameMode> = new Map<userId, GameMode>();
  private readonly modeOneQueue: Map<userId, rating> = new Map<rating, userId>();
  private readonly modeTwoQueue: Map<userId, rating> = new Map<rating, userId>();

  find(userId: userId): rating | undefined {
    const gameMode = this.modeMap.get(userId);
    if (gameMode === undefined) return undefined;
    return gameMode === GameMode.MODE_ONE ? this.modeOneQueue.get(userId) : this.modeTwoQueue.get(userId);
  }

  findAll(gameMode: GameMode): Map<userId, rating> {
    return gameMode === GameMode.MODE_ONE ? this.modeOneQueue : this.modeTwoQueue;
  }

  save(gameMode: GameMode, element: Record<userId, rating>): void {
    this.modeMap.set(element[0], gameMode);
    gameMode === GameMode.MODE_ONE
      ? this.modeOneQueue.set(element[0], element[1])
      : this.modeTwoQueue.set(element[0], element[1]);
    return;
  }

  delete(userId: userId): boolean {
    this.modeMap.get(userId) === GameMode.MODE_ONE
      ? this.modeOneQueue.delete(userId)
      : this.modeTwoQueue.delete(userId);
    return this.modeMap.delete(userId);
  }
}
