import { Injectable } from '@nestjs/common';
import { Game } from 'src/game/game.interface';

type GameId = number;
type GameUserSocket = string;
type Index = number;

@Injectable()
export class GameRepository {
  private readonly gameMap: Map<GameId, Game>;
  private readonly inUser: Map<GameUserSocket, GameId>;
  private index: Index;

  constructor() {
    this.gameMap = new Map<GameId, Game>();
    this.inUser = new Map<GameUserSocket, GameId>();
    this.index = 0;
  }

  find(gameId: number): Game | undefined {
    return this.gameMap.get(gameId);
  }

  findBySocket(userSocket: GameUserSocket): Game | undefined {
    const gameId: GameId = this.inUser.get(userSocket);
    if (gameId === undefined) return undefined;
    return this.gameMap.get(gameId);
  }

  findAll(): Map<GameId, Game> {
    return this.gameMap;
  }

  save(game: Game): Index {
    const ret = this.index;
    this.gameMap.set(this.index, game);
    this.inUser.set(game.gameInfo.leftUser.userSocket, ret);
    this.inUser.set(game.gameInfo.rightUser.userSocket, ret);
    this.index++;

    return ret;
  }

  delete(gameId: GameId): boolean {
    const game = this.gameMap.get(gameId);

    this.inUser.delete(game.gameInfo.leftUser.userSocket);
    this.inUser.delete(game.gameInfo.rightUser.userSocket);
    return this.gameMap.delete(gameId);
  }
}
