import { InjectRepository } from '@nestjs/typeorm';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { User } from 'src/common/entities/user.entity';
import { Invitation, InvitationRepository } from 'src/repository/invitation.repository';
import { UserSocketRepository } from 'src/repository/user-socket.repository';
import { UserState, UserStateRepository } from 'src/repository/user-state.repository';
import { Repository } from 'typeorm';

const GameInviteEvent = {
  invite: 'invite',
  inviteSuccess: 'invite-success',
  inviteConfirm: 'invite-confirm',
  inviteTimeout: 'invite-timeout',
  inviteError: 'invite-error',
};

interface EmitInviteError {
  msg: string;
}

interface EmitInvite {
  inviterName: string;
  inviterAvatarUrl: string;
  invitationId: number;
}

interface GameUser {
  id: number;
  name: string;
  avatarURL: string;
}

interface EmitInviteConfirm {
  result: boolean;
  leftUser: GameUser | undefined;
  rightUser: GameUser | undefined;
  gameRoomId: number | undefined;
}

class InvitationUsersSocket {
  private inviterSocket: string | undefined;
  private inviteeSocket: string | undefined;

  constructor(inviterSocket: string, inviteeSocket: string) {
    this.inviterSocket = inviterSocket;
    this.inviteeSocket = inviteeSocket;
  }

  get inviter(): string | undefined {
    return this.inviterSocket;
  }

  get invitee(): string | undefined {
    return this.inviteeSocket;
  }

  areAvailable(): boolean {
    if (this.inviterSocket !== undefined && this.inviteeSocket !== undefined) return true;
    return false;
  }

  checkSocketPermission(connectedSocketId: string): boolean {
    if (this.inviterSocket === connectedSocketId || this.inviteeSocket === connectedSocketId) return true;
    return false;
  }
}

@WebSocketGateway()
export class GameInvitationGateway {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly invitationRepository: InvitationRepository,
    private readonly userSocketRepository: UserSocketRepository,
    private readonly userStateRepository: UserStateRepository,
  ) {}

  @WebSocketServer()
  server: Server;

  getInvitationUsersSocket(invitation: Invitation): InvitationUsersSocket {
    const inviteeSocket = this.userSocketRepository.find(invitation.inviteeId);
    const inviterSocket = this.userSocketRepository.find(invitation.inviterId);

    return new InvitationUsersSocket(inviterSocket, inviteeSocket);
  }

  sendInviteError(someone: string, msg: string) {
    const data: EmitInviteError = {
      msg: msg,
    };
    this.server.to(someone).emit(GameInviteEvent.inviteError, data);
  }

  @SubscribeMessage('accept-invite')
  async acceptInvite(@ConnectedSocket() userSocket: Socket, @MessageBody() acceptInviteDto: { invitationId: number }) {
    const invitation = this.invitationRepository.find(acceptInviteDto.invitationId);
    if (!invitation) {
      this.sendInviteError(userSocket.id, '유효하지 않는 초대입니다.');
      return;
    }
    const sockets: InvitationUsersSocket = this.getInvitationUsersSocket(invitation);
    if (sockets.invitee !== userSocket.id) return this.sendInviteError(userSocket.id, '유효하지 않는 접근입니다.');

    const inviterInfo: User = await this.userRepository.findOne({ where: { id: invitation.inviterId } });
    const inviteeInfo: User = await this.userRepository.findOne({ where: { id: invitation.inviteeId } });

    let changeState: () => void = undefined;
    let data: EmitInviteConfirm = undefined;

    if (inviteeInfo && inviterInfo) {
      // TODO: GENERATE GAME
      data = {
        result: true,
        leftUser: {
          id: inviteeInfo.id,
          name: inviteeInfo.userName,
          // FIXME:
          avatarURL: inviteeInfo.email,
        },
        rightUser: {
          id: inviterInfo.id,
          name: inviterInfo.userName,
          // FIXME:
          avatarURL: inviterInfo.email,
        },
        gameRoomId: 0,
      };
      changeState = (): void => {
        this.userStateRepository.update(invitation.inviteeId, UserState.IN_GAME);
        this.userStateRepository.update(invitation.inviterId, UserState.IN_GAME);
      };
    } else {
      data = {
        result: false,
        leftUser: undefined,
        rightUser: undefined,
        gameRoomId: undefined,
      };
      changeState = (): void => {
        this.userStateRepository.update(invitation.inviteeId, UserState.IDLE);
        this.userStateRepository.update(invitation.inviterId, UserState.IDLE);
      };
    }

    this.invitationRepository.delete(acceptInviteDto.invitationId);
    if (sockets.inviter) {
      this.server.to(sockets.invitee).emit(GameInviteEvent.inviteConfirm, data);
      this.server.to(sockets.inviter).emit(GameInviteEvent.inviteConfirm, data);
      changeState();
    } else {
      this.server.to(sockets.invitee).emit(GameInviteEvent.inviteError, {
        msg: '상대가 접속중이지 않습니다',
      });
      this.userStateRepository.update(invitation.inviteeId, UserState.IDLE);
      this.userStateRepository.update(invitation.inviterId, UserState.IDLE);
    }
  }

  @SubscribeMessage('reject-invite')
  rejectInvite(@ConnectedSocket() userSocket: Socket, @MessageBody() rejectInviteDto: { invitationId: number }) {
    const invitation = this.invitationRepository.find(rejectInviteDto.invitationId);
    if (!invitation) return;

    const sockets: InvitationUsersSocket = this.getInvitationUsersSocket(invitation);
    if (sockets.invitee !== userSocket.id) return this.sendInviteError(userSocket.id, '유효하지 않는 접근입니다.');

    const data: EmitInviteConfirm = {
      result: false,
      leftUser: undefined,
      rightUser: undefined,
      gameRoomId: undefined,
    };
    if (sockets.inviter) this.server.to(sockets.inviter).emit(GameInviteEvent.inviteConfirm, data);

    this.invitationRepository.delete(rejectInviteDto.invitationId);
    this.userStateRepository.update(invitation.inviteeId, UserState.IDLE);
    this.userStateRepository.update(invitation.inviterId, UserState.IDLE);
  }

  sendInvite(
    inviter: { id: number; avatarUrl: string; userName: string },
    inviteeId: number,
    invitationId: number,
  ): boolean {
    const inviteeSocket: string | undefined = this.userSocketRepository.find(inviteeId);
    const inviterSocket: string | undefined = this.userSocketRepository.find(inviter.id);

    if (!inviteeSocket) {
      this.sendInviteError(inviterSocket, '상대방이 접속중이지 않음.');
      return false;
    } else if (!inviterSocket) {
      return false;
    }

    const inviteData: EmitInvite = {
      inviterName: inviter.userName,
      inviterAvatarUrl: inviter.avatarUrl,
      invitationId: invitationId,
    };
    this.server.to(inviteeSocket).emit(GameInviteEvent.invite, inviteData);
    this.server.to(inviterSocket).emit(GameInviteEvent.inviteSuccess);
    return true;
  }

  sendInviteTimeout(invitation: Invitation) {
    const inviterSocket: string | undefined = this.userSocketRepository.find(invitation.inviterId);

    if (inviterSocket) this.sendInviteError(inviterSocket, '상대가 제한 시간 내 초대를 받지 않음');
  }
}
