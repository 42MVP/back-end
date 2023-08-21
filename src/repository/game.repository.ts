import { Injectable } from '@nestjs/common';
import { Game } from 'src/game/game.interface';

@Injectable()
export class GameRepository {
  private readonly gameMap: Map<number, Game>;
  private index: number;

  constructor() {
    this.gameMap = new Map<number, Game>();
    this.index = 0;
  }

  find(gameId: number): Game | undefined {
    return this.gameMap.get(gameId);
  }

  findAll(): Map<number, Game> {
    return this.gameMap;
  }

  save(game: Game): number {
    const ret = this.index;
    this.gameMap.set(this.index, game);
    this.index++;

    return ret;
  }

  delete(gameId: number): boolean {
    return this.gameMap.delete(gameId);
  }
}
