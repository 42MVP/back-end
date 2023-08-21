import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Game, RenderInfo } from 'src/game/game.interface';
import { GameRepository } from 'src/repository/game.repository';

interface GameUserData {
  avatarURL: string;
  name: string;
  rating: number;
}

interface MatchData {
  result: boolean;
  leftUser: GameUserData;
  rightUser: GameUserData;
  gameRoomId: number;
  startAt: Date;
}

interface InitInfo {
  background: string;
  leftScore: number;
  rightScore: number;
  tableInfo: RenderInfo;
}

@WebSocketGateway()
export class TempGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly gameRepository: GameRepository) {}

  joinTestGameRoom(user1Id: number, user1socket: string, user2Id: number, user2socket: string) {
    const gameId = this.gameRepository.save(
      new Game(
        {
          userId: user1Id,
          userName: 'user 1',
          userSocket: user1socket,
        },
        {
          userId: user2Id,
          userName: 'user 2',
          userSocket: user2socket,
        },
      ),
    );
    const game = this.gameRepository.find(gameId);
    const gameRoomName: string = game.gameInfo.roomId.toString();
    this.server.in(game.gameInfo.leftUser.userSocket).socketsJoin(gameRoomName);
    this.server.in(game.gameInfo.rightUser.userSocket).socketsJoin(gameRoomName);
    this.server.to(gameRoomName).emit('enter-game');
    this.server.to(gameRoomName).emit('complete', {
      result: true,
      leftUser: { avatarURL: '', name: 'testUser1', rating: 42 },
      rightUser: { avatarURL: '', name: 'testUser2', rating: 24 },
      gameRoomId: 42,
      startAt: new Date(new Date().getTime() + 5000),
    } as MatchData);
    this.server.to(gameRoomName).emit('init', {
      background: game.gameInfo.backgroundColor,
      leftScore: game.scoreInfo.leftScore,
      rightScore: game.scoreInfo.rightScore,
      tableInfo: game.renderInfo,
    } as InitInfo);
  }
}
