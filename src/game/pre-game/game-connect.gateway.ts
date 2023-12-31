import { InjectRepository } from '@nestjs/typeorm';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { User } from 'src/common/entities/user.entity';
import { GameRepository } from 'src/repository/game.repository';
import { Repository } from 'typeorm';
import { EmitConfirm, Game, GameMode, GameUser } from '../game';
import { UserState, UserStateRepository } from 'src/repository/user-state.repository';

@WebSocketGateway()
export class GameConnectGateway {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly gameRepository: GameRepository,
    private readonly userStateRepository: UserStateRepository,
  ) {}

  @WebSocketServer()
  server: Server;

  async createNewGame(
    gameMode: GameMode,
    user1Id: number,
    user2Id: number,
    user1Socket: string | undefined,
    user2Socket: string | undefined,
  ): Promise<Game | null> {
    const user1: User = await this.userRepository.findOne({ where: { id: user1Id } });
    const user2: User = await this.userRepository.findOne({ where: { id: user2Id } });
    if (!user1 || !user2 || user1Socket === undefined || user2Socket === undefined) {
      return null;
    } else {
      const newGame: Game = new Game(gameMode, new GameUser(user1, user1Socket), new GameUser(user2, user2Socket));
      newGame.gameInfo.roomId = this.gameRepository.save(newGame);
      return newGame;
    }
  }

  updateInGameStatus(user1Id: number, user2Id: number, emitResult: EmitConfirm) {
    if (emitResult.result === true) {
      this.userStateRepository.update(user1Id, UserState.IN_GAME);
      this.userStateRepository.update(user2Id, UserState.IN_GAME);
    } else {
      this.userStateRepository.update(user1Id, UserState.IDLE);
      this.userStateRepository.update(user2Id, UserState.IDLE);
    }
  }

  enterGameRoom(newGame: Game) {
    const newGameRoomName: string = newGame.gameInfo.roomId.toString();
    this.server.in(newGame.gameInfo.leftUser.userSocket).socketsJoin(newGameRoomName);
    this.server.in(newGame.gameInfo.rightUser.userSocket).socketsJoin(newGameRoomName);
    return newGame;
  }
}
