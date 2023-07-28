import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatMessageDto } from './dto/request/chat-message.dto';
import { ChatUserStatus } from '../common/enums';
import { ChangedUserRoleDto } from './dto/response/changed-user-role.dto';
import { ChangedUserStatusDto } from './dto/response/changed-user-status.dto';
import { UserSocketRepository } from '../repository/user-socket.repository';
import { MuteTimeRepository } from '../repository/mute-time.repository';

@WebSocketGateway()
export class ChatGateway {
  constructor(
    private readonly userSocketRepository: UserSocketRepository,
    private readonly muteTimeRepository: MuteTimeRepository,
  ) {}
  @WebSocketServer()
  server: Server;

  // // 테스트용 connection 함수: 실제 구동에는 사용하지 않습니다.
  // handleConnection(@ConnectedSocket() client: Socket) {
  //   console.log(`${userId}: socketid [${client.id}]`);
  //   this.userSocketRepository.save(userId, client.id);
  //   userId++;
  // }

  isUserMuted(userId: number): boolean {
    const userMuteTime: Date | undefined = this.muteTimeRepository.find(userId);
    if (typeof userMuteTime === undefined) {
      return false;
    }
    const timeOfNow: Date = new Date();
    if (userMuteTime >= timeOfNow) {
      return true;
    } else {
      this.muteTimeRepository.delete(userId);
      return false;
    }
  }

  @SubscribeMessage('send-message')
  handleMessage(@ConnectedSocket() client: Socket, @MessageBody() message: ChatMessageDto): void {
    if (this.isUserMuted(message.userId) === true) return;
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
