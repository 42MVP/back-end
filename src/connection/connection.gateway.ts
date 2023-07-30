import { ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway } from '@nestjs/websockets';
import { ConnectionService } from './connection.service';
import { Socket } from 'socket.io';
import { UserSocketRepository } from 'src/repository/user-socket.repository';
import { AuthService } from 'src/auth/auth.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway()
export class ConnectionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly connectionService: ConnectionService,
    private readonly userSocketRepository: UserSocketRepository,
    private readonly authService: AuthService,
  ) {}

  private readonly logger = new Logger('Gateway');

  async handleConnection(@ConnectedSocket() client: Socket) {
    this.logger.log(`${client.id} client is connected`);
    // 개발용
    const id: number = await this.authService.jwtVerify(client.handshake.headers.authorization);
    // 배포용
    // const id: number = await this.authService.jwtVerify(client.handshake.auth.token);
    this.userSocketRepository.save(id, client.id);
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
