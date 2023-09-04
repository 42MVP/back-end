import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ConnectionService } from './connection.service';
import { Server, Socket } from 'socket.io';
import { UserSocketRepository } from 'src/repository/user-socket.repository';
import { AuthService } from 'src/auth/auth.service';
import { Logger } from '@nestjs/common';
import { UserState, UserStateRepository } from 'src/repository/user-state.repository';
import { Game, GameStatus, defaultSetting } from 'src/game/game';
import { GameRepository } from 'src/repository/game.repository';
import { QueueRepository } from 'src/repository/queue.repository';

@WebSocketGateway({ cors: true })
export class ConnectionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly connectionService: ConnectionService,
    private readonly userSocketRepository: UserSocketRepository,
    private readonly userStateRepository: UserStateRepository,
    private readonly gameRepository: GameRepository,
    private readonly authService: AuthService,
    private readonly queueRepository: QueueRepository,
  ) {}
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('Gateway');

  async handleConnection(@ConnectedSocket() client: Socket) {
    this.logger.log(`${client.id} client is connected`);
    // 개발용
    try {
      const id: number = await this.authService.jwtVerify(client.handshake.auth.token);
      this.userSocketRepository.save(id, client.id);
      this.userStateRepository.save(id, UserState.IDLE);
      const userRooms: number[] = await this.connectionService.getUserRoomId(id);
      console.log('connect room:', userRooms);
      userRooms.forEach(e => {
        this.server.in(client.id).socketsJoin(e.toString());
      });
    } catch (e) {
      console.error('JWT 인증 실패');
      client.disconnect();
    }
    // 배포용
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.log(`${client.id} client is disconnected`);
    // 개발용
    try {
      const id: number = await this.authService.jwtVerify(client.handshake.auth.token);
      const state: UserState = this.userStateRepository.find(id);
      switch (state) {
        case UserState.IN_GAME:
          this.forceQuitGame(this.gameRepository.findBySocket(client.id), id);
          break;
        case UserState.IN_QUEUE:
          this.queueRepository.delete(id);
          break;
      }
      this.userSocketRepository.delete(id);
      this.userStateRepository.delete(id);
    } catch (e) {
      console.error('JWT 인증 실패');
    }
    client.disconnect();
    // 배포용
  }

  @SubscribeMessage('forceQuit')
  async handleForceQuit(@ConnectedSocket() client: Socket) {
    const id: number = await this.authService.jwtVerify(client.handshake.auth.token);
    this.forceQuitGame(this.gameRepository.findBySocket(client.id), id);
  }

  forceQuitGame(game: Game | undefined, exitUserId: number) {
    if (game !== undefined) {
      const leftExit: boolean = exitUserId === game.gameInfo.leftUser.userId ? true : false;
      game.connectInfo.gameStatus = GameStatus.GAME_END;
      game.scoreInfo.leftScore = leftExit ? 0 : defaultSetting.matchPoint;
      game.scoreInfo.rightScore = leftExit ? defaultSetting.matchPoint : 0;
      game.resultInfo.win = leftExit ? game.gameInfo.rightUser : game.gameInfo.leftUser;
      game.resultInfo.defeat = leftExit ? game.gameInfo.leftUser : game.gameInfo.rightUser;
    }
  }
}
