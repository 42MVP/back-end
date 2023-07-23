import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatMessageDto } from './dto/request/chat-message.dto';
import { ChatUserStatus } from '../database/entities/enums';
import { ChangedUserRoleDto } from './dto/response/changed-user-role.dto';
import { ChangedUserStatusDto } from './dto/response/changed-user-status.dto';

@WebSocketGateway()
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('send-message')
  handleMessage(@ConnectedSocket() client: Socket, @MessageBody() message: ChatMessageDto): void {
    this.server.to(message.roomId).emit('receive-message', message);
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

  sendChangedUserStatus(newStatus: ChangedUserStatusDto, roomId: number): void {
    const roomName: string = roomId.toString();
    switch (newStatus.status) {
      case ChatUserStatus.BAN:
        this.server.to(roomName).emit('ban', newStatus);
      case ChatUserStatus.KICK:
        this.server.to(roomName).emit('kick', newStatus);
      case ChatUserStatus.MUTE:
        this.server.to(roomName).emit('mute', newStatus);
    }
    return;
  }
}
