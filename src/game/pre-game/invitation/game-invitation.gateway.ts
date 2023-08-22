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
    const inviteeSocket: string | undefined = this.userSocketRepository.find(invitation.inviteeId);
    const inviterSocket: string | undefined = this.userSocketRepository.find(invitation.inviterId);
    if (inviteeSocket !== userSocket.id) return this.sendInviteError(userSocket.id, '유효하지 않는 접근입니다.');

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
    if (inviterSocket) this.server.to(inviteeSocket).emit(GameInviteEvent.inviteConfirm, data);
    if (inviteeSocket) this.server.to(inviterSocket).emit(GameInviteEvent.inviteConfirm, data);
    changeState();
  }

  @SubscribeMessage('reject-invite')
  rejectInvite(@ConnectedSocket() userSocket: Socket, @MessageBody() rejectInviteDto: { invitationId: number }) {
    const invitation = this.invitationRepository.find(rejectInviteDto.invitationId);
    if (!invitation) return;

    const inviteeSocket: string | undefined = this.userSocketRepository.find(invitation.inviteeId);
    const inviterSocket: string | undefined = this.userSocketRepository.find(invitation.inviterId);
    if (inviteeSocket !== userSocket.id) return this.sendInviteError(userSocket.id, '유효하지 않은 접근입니다');

    const data: EmitInviteConfirm = {
      result: false,
      leftUser: undefined,
      rightUser: undefined,
      gameRoomId: undefined,
    };
    if (inviterSocket) this.server.to(inviterSocket).emit(GameInviteEvent.inviteConfirm, data);

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
    return true;
  }

  sendInviteTimeout(invitation: Invitation) {
    const inviterSocket: string | undefined = this.userSocketRepository.find(invitation.inviterId);

    if (inviterSocket) this.sendInviteError(inviterSocket, '상대가 제한 시간 내 초대를 받지 않음');
  }
}
