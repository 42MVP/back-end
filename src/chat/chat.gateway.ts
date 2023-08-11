import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatMessageDto } from './dto/request/chat-message.dto';
import { ChatUserStatus } from '../common/enums';
import { ChangedUserRoleDto } from './dto/response/changed-user-role.dto';
import { ChangedUserStatusDto } from './dto/response/changed-user-status.dto';
import { UserSocketRepository } from '../repository/user-socket.repository';
import { MuteTimeRepository } from '../repository/mute-time.repository';
import { ChatUser } from 'src/common/entities/chatuser.entity';

@WebSocketGateway({ cors: true })
export class ChatGateway {
  constructor(
    private readonly userSocketRepository: UserSocketRepository,
    private readonly muteTimeRepository: MuteTimeRepository,
  ) {}
  @WebSocketServer()
  server: Server;

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

  joinChatRoom(userSocket: string, chatUser: ChatUser) {
    const roomName: string = chatUser.roomId.toString();
    this.server.in(userSocket).socketsJoin(roomName);
    this.server.to(roomName).emit('join', { roomId: chatUser.roomId, userId: chatUser.userId });
    return;
  }

  exitChatRoom(userSocket: string, chatUser: ChatUser) {
    const roomName: string = chatUser.roomId.toString();
    this.server.to(roomName).emit('leave', { roomId: chatUser.roomId, userId: chatUser.userId });
    this.server.in(userSocket).socketsLeave(roomName);
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
        this.server.to(roomName).emit('ban', newStatus);
        this.server.to(userSocket).socketsLeave(roomName);
        break;
      case ChatUserStatus.KICK:
        this.server.to(roomName).emit('kick', newStatus);
        this.server.to(userSocket).socketsLeave(roomName);
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
