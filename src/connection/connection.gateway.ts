import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ConnectionService } from './connection.service';
import { Server, Socket } from 'socket.io';
import { UserSocketRepository } from 'src/repository/user-socket.repository';
import { AuthService } from 'src/auth/auth.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: true })
export class ConnectionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly connectionService: ConnectionService,
    private readonly userSocketRepository: UserSocketRepository,
    private readonly authService: AuthService,
  ) {}
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('Gateway');

  async handleConnection(@ConnectedSocket() client: Socket) {
    this.logger.log(`${client.id} client is connected`);
    // 개발용
    //const id: number = await this.authService.jwtVerify(client.handshake.headers.authorization);
    // 배포용
    const id: number = await this.authService.jwtVerify(client.handshake.auth.token);
    this.userSocketRepository.save(id, client.id);
    const userRooms: number[] = await this.connectionService.getUserRoomId(id);
    console.log('connect room:', userRooms);
    userRooms.forEach(e => {
      this.server.in(client.id).socketsJoin(e.toString());
    });
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.log(`${client.id} client is disconnected`);
    // 개발용
    const id: number = await this.authService.jwtVerify(client.handshake.headers.authorization);
    // 배포용
    // const id: number = await this.authService.jwtVerify(client.handshake.auth.token);
    this.userSocketRepository.delete(id);
  }
}
