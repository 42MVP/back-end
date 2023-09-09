import { Injectable } from '@nestjs/common';
import { GameMode } from 'src/game/game';

export type rating = number;
export type userId = number;

const mode = [];
@Injectable()
export class QueueRepository {
  private readonly modeMap: Map<userId, GameMode> = new Map<userId, GameMode>();
  private readonly modeQueue: Map<userId, rating>[] = new Array<Map<userId, rating>>(3);
  // private readonly modeOneQueue: Map<userId, rating>[] = new Map<rating, userId>();
  // private readonly modeTwoQueue: Map<userId, rating> = new Map<rating, userId>();

  find(userId: userId): rating | undefined {
    const gameMode = this.modeMap.get(userId);
    if (gameMode === undefined) return undefined;
    return this.modeQueue[gameMode].get(userId);
    // return gameMode === GameMode.MODE_ONE ? this.modeOneQueue.get(userId) : this.modeTwoQueue.get(userId);
  }

  findAll(): Map<userId, rating>[] {
    return this.modeQueue;
  }

  save(gameMode: GameMode, element: Record<userId, rating>): void {
    this.modeMap.set(element[0], gameMode);
    // gameMode === GameMode.MODE_ONE
    //   ? this.modeOneQueue.set(element[0], element[1])
    //   : this.modeTwoQueue.set(element[0], element[1]);
    this.modeQueue[gameMode].set(element[0], element[1]);
    return;
  }

  update(element: Record<userId, rating>) {
    const gameMode: GameMode = this.modeMap.get(element[0]);
    return this.modeQueue[gameMode].set(element[0], element[1]);
    // return this.modeMap.get(element[0]) === GameMode.MODE_ONE
    //   ? this.modeOneQueue.set(element[0], element[1])
    //   : this.modeTwoQueue.set(element[0], element[1]);
  }

  delete(userId: userId): boolean {
    const gameMode: GameMode = this.modeMap.get(userId);
    // this.modeMap.get(userId) === GameMode.MODE_ONE
    //   ? this.modeOneQueue.delete(userId)
    //   : this.modeTwoQueue.delete(userId);
    return this.modeQueue[gameMode].delete(userId);
  }
}
