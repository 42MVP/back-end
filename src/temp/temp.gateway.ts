import { ConnectedSocket, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

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

@WebSocketGateway()
export class TempGateway {
  @WebSocketServer()
  server: Server;

  private gameRepository: Map<string, Game> = new Map<string, Game>();

  devGame: Game = {
    gameInfo: {
      roomId: 42,
      leftUser: { userId: 42, userName: 'testUser1', userSocket: null },
      rightUser: { userId: 24, userName: 'testUser2', userSocket: 'not_real_socket_id' },
      backgroundColor: 'white',
    },
    scoreInfo: { leftScore: 0, rightScore: 0 },
    renderInfo: {
      leftPaddle: { width: 20, height: 100, x: 0, y: 300 },
      rightPaddle: { width: 20, height: 100, x: 800 - 20, y: 300 },
      ball: { x: 400, y: 300, dx: 1, dy: -1 },
    },
  };

  // failData: MatchData = {
  //   result: false,
  //   leftUser: null,
  //   rightUser: null,
  //   gameRoomId: 0,
  //   startAt: null,
  // };

  successData: MatchData = {
    result: true,
    leftUser: { avatarURL: '', name: 'testUser1', rating: 42 },
    rightUser: { avatarURL: '', name: 'testUser2', rating: 24 },
    gameRoomId: 42,
    startAt: new Date(new Date().getTime() + 5000),
  };

  @SubscribeMessage('testGameJoin') // dev-test only;
  joinTestGameRoom(@ConnectedSocket() client: Socket) {
    this.devGame.gameInfo.leftUser.userSocket = client.id;
    this.gameRepository.set(client.id, this.devGame);
    this.server.in(client.id).socketsJoin('dev-test');
    this.server.to('dev-test').emit('enterGame');
  }

  @SubscribeMessage('testComplete')
  sendCompleteMessage(@ConnectedSocket() client: Socket) {
    if (client.id === this.devGame.gameInfo.leftUser.userSocket) {
      const completeData: MatchData = this.successData;
      this.server.to('dev-test').emit('complete', completeData);
      this.server.to('dev-test').emit('init', this.devGame);
    }
  }
}
