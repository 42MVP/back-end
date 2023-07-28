import { ConnectedSocket, WebSocketGateway } from '@nestjs/websockets';
import { ConnectionService } from './connection.service';
import { Socket } from 'socket.io';
import { UserSocketRepository } from 'src/repository/user-socket.repository';
import { AuthService } from 'src/auth/auth.service';

@WebSocketGateway()
export class ConnectionGateway {
  constructor(
    private readonly connectionService: ConnectionService,
    private readonly userSocketRepository: UserSocketRepository,
    private readonly authService: AuthService,
  ) {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    // 개발용
    const id: number = await this.authService.jwtVerify(client.handshake.headers.authorization);
    // 배포용
    // const id: number = await this.authService.jwtVerify(client.handshake.auth.token);
    console.log(`${id}: socketid [${client.id}]`);
    this.userSocketRepository.save(id, client.id);
  }
}
