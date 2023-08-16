import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatMessageDto } from './dto/request/chat-message.dto';
import { UserSocketRepository } from '../repository/user-socket.repository';
import { MuteTimeRepository } from '../repository/mute-time.repository';
import { ChatRoom } from 'src/common/entities/chatroom.entity';

interface SocketUserInfo {
  roomId: number;
  userId: number;
  name: string;
  avatarURL: string;
}
interface SocketUserAction {
  roomId: number;
  userId: number;
}
interface SocketMute {
  roomId: number;
  userId: number;
  abongTime: Date;
}
interface SocketUserMode {
  roomId: number;
  userId: number;
  role: string;
}

@WebSocketGateway({ cors: true })
export class ChatGateway {
  constructor(
    private readonly userSocketRepository: UserSocketRepository,
    private readonly muteTimeRepository: MuteTimeRepository,
  ) {}
  @WebSocketServer()
  server: Server;

  isUserMuted(roomId: number, userId: number): boolean {
    const userMuteTime: Date | undefined = this.muteTimeRepository.find(roomId, userId);
    if (typeof userMuteTime === undefined) {
      return false;
    }
    const timeOfNow: Date = new Date();
    if (userMuteTime >= timeOfNow) {
      return true;
    } else {
      this.muteTimeRepository.delete(roomId, userId);
      return false;
    }
  }

  @SubscribeMessage('send-message')
  joinToRoom(userId: number, roomId: number): void {
    const userSocket = this.userSocketRepository.find(userId);
    if (userSocket === undefined) return;

    const roomName: string = roomId.toString();
    this.server.in(userSocket).socketsJoin(roomName);
  }

  leaveFromRoom(userId: number, roomId: number) {
    const userSocket = this.userSocketRepository.find(userId);
    if (userSocket === undefined) return;

    const roomName: string = roomId.toString();
    this.server.to(userSocket).socketsLeave(roomName);
  }

  private emitToRoom(roomId: number, eventName: string, data: any): void {
    const roomName: string = roomId.toString();
    this.server.to(roomName).emit(eventName, data);
  }

  handleMessage(@ConnectedSocket() client: Socket, @MessageBody() message: ChatMessageDto): void {
    if (this.isUserMuted(message.roomId, message.userId) === true) return;
    this.emitToRoom(message.roomId, 'receive-message', message);
  }

  sendAddedRoom(userId: number, data: ChatRoom) {
    const userSocket = this.userSocketRepository.find(userId);
    if (userSocket === undefined) return;

    this.server.to(userSocket).emit('addedRoom', data);
  }

  // SocketUserInfo

  sendJoin(data: SocketUserInfo) {
    this.emitToRoom(data.roomId, 'join', data);
  }

  sendBan(data: SocketUserInfo) {
    this.emitToRoom(data.roomId, 'ban', data);
  }

  // ===========================

  // SocketUserAction
  sendKick(data: SocketUserAction) {
    this.emitToRoom(data.roomId, 'kick', data);
  }

  sendLeave(data: SocketUserAction) {
    this.emitToRoom(data.roomId, 'leave', data);
  }

  sendUnban(data: SocketUserAction) {
    this.emitToRoom(data.roomId, 'unban', data);
  }
  // ===========================

  // SocketMute
  sendMute(data: SocketMute) {
    this.emitToRoom(data.roomId, 'mute', data);
  }
  // ===========================

  // SocketUserMode
  sendUserMode(data: SocketUserMode) {
    this.emitToRoom(data.roomId, 'userMode', data);
  }
  // ===========================
}
