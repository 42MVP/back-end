import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatMessageDto } from './dto/chat-message.dto';
import { ChatRole, ChatUserStatus } from '../database/entities/enums';

@WebSocketGateway()
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('send-message')
  handleMessage(@ConnectedSocket() client: Socket, @MessageBody() message: ChatMessageDto): void {
    this.server.to(message.roomId).emit('receive-message', message);
    return;
  }

  joinChatRoom(userSocket: string, roomId: number) {
    const roomName: string = roomId.toString();
    this.server.in(userSocket).socketsJoin(roomName);
    this.server.to(roomName).emit('join');
    return;
  }

  handleUserStatus(roomId: string, newStatus: ChatUserStatus): void {
    if (newStatus == ChatUserStatus.BAN) {
      this.server.to(roomId).emit('ban', 'ban');
    } else if (newStatus == ChatUserStatus.KICK) {
      this.server.to(roomId).emit('kick', 'kick');
    } else if (newStatus == ChatUserStatus.MUTE) {
      this.server.to(roomId).emit('mute', 'mute');
    }
    return;
  }

  handleUserRole(roomId: string, newRole: ChatRole): void {
    if (newRole == ChatRole.ADMIN) {
      this.server.to(roomId).emit('userMode', 'admin');
    } else {
      this.server.to(roomId).emit('userMode', 'user');
    }
    return;
  }
}
