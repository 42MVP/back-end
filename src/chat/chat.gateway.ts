import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatMessageDto } from './dto/request/chat-message.dto';
import { ChatUserStatus } from '../database/entities/enums';
import { ChangedUserRoleDto } from './dto/response/changed-user-role.dto';
import { ChangedUserStatusDto } from './dto/response/changed-user-status.dto';
import { UserSocketRepository } from '../repository/user-socket.repository';

let userId = 1;
@WebSocketGateway()
export class ChatGateway {
  constructor(private readonly userSocketRepository: UserSocketRepository) {}
  @WebSocketServer()
  server: Server;

  // 테스트용 connection 함수: 실제 구동에는 사용하지 않습니다.
  handleConnection(@ConnectedSocket() client: Socket) {
    console.log(`${userId}: socketid [${client.id}]`);
    this.userSocketRepository.save(userId, client.id);
    userId++;
  }

  // TODO: mute 판별 로직을 추가하기
  @SubscribeMessage('send-message')
  handleMessage(@ConnectedSocket() client: Socket, @MessageBody() message: ChatMessageDto): void {
    const roomName: string = message.roomId.toString();
    this.server.to(roomName).emit('receive-message', message);
    return;
  }

  joinChatRoom(userSocket: string, userName: string, roomId: number) {
    const roomName: string = roomId.toString();
    this.server.in(userSocket).socketsJoin(roomName);
    this.server.to(roomName).emit('join', userName);
    return;
  }

  exitChatRoom(userSocket: string, userName: string, roomId: number) {
    const roomName: string = roomId.toString();
    this.server.in(userSocket).socketsLeave(roomName);
    this.server.to(roomName).emit('leave', userName);
    return;
  }

  sendChangedUserRole(newRole: ChangedUserRoleDto, roomId: number): void {
    const roomName: string = roomId.toString();
    this.server.to(roomName).emit('userMode', newRole);
    return;
  }

  sendChangedUserStatus(userSocket: string, newStatus: ChangedUserStatusDto, roomId: number): void {
    const roomName: string = roomId.toString();
    switch (newStatus.status) {
      case ChatUserStatus.BAN:
        this.server.to(userSocket).socketsLeave(roomName);
        this.server.to(roomName).emit('ban', newStatus);
        break;
      case ChatUserStatus.KICK:
        this.server.to(userSocket).socketsLeave(roomName);
        this.server.to(roomName).emit('kick', newStatus);
        break;
      case ChatUserStatus.MUTE:
        this.server.to(roomName).emit('mute', newStatus);
        break;
      default:
        break;
    }
    return;
  }
}
