import { InjectRepository } from '@nestjs/typeorm';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { User } from 'src/common/entities/user.entity';
import { Invitation, InvitationRepository } from 'src/repository/invitation.repository';
import { UserSocketRepository } from 'src/repository/user-socket.repository';
import { UserState, UserStateRepository } from 'src/repository/user-state.repository';
import { GameConnectGateway } from '../game-connect.gateway';
import { EmitInvite, EmitInviteConfirm, EmitInviteError, Game } from 'src/game/game';

const GameInviteEvent = {
  invite: 'invite',
  inviteConfirm: 'invite-confirm',
  inviteTimeout: 'invite-timeout',
  inviteError: 'invite-error',
};

@WebSocketGateway()
export class GameInvitationGateway {
  constructor(
    @InjectRepository(User)
    private readonly invitationRepository: InvitationRepository,
    private readonly userSocketRepository: UserSocketRepository,
    private readonly userStateRepository: UserStateRepository,
    private readonly gameConnectGateway: GameConnectGateway,
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

    const newGame: Game | null = await this.gameConnectGateway.createNewGame(
      invitation.inviteeId,
      invitation.inviterId,
      inviteeSocket,
      inviterSocket,
    );
    const inviteConfirm: EmitInviteConfirm = new EmitInviteConfirm(newGame);
    this.invitationRepository.delete(acceptInviteDto.invitationId);
    if (inviterSocket) this.server.to(inviteeSocket).emit(GameInviteEvent.inviteConfirm, inviteConfirm);
    if (inviteeSocket) this.server.to(inviterSocket).emit(GameInviteEvent.inviteConfirm, inviteConfirm);

    // changeState()
    this.gameConnectGateway.updateInGameStatus(invitation.inviteeId, invitation.inviterId, inviteConfirm);

    // enter to the GameRoom
    if (newGame) this.gameConnectGateway.enterGameRoom(newGame);
  }

  @SubscribeMessage('reject-invite')
  rejectInvite(@ConnectedSocket() userSocket: Socket, @MessageBody() rejectInviteDto: { invitationId: number }) {
    const invitation = this.invitationRepository.find(rejectInviteDto.invitationId);
    if (!invitation) return;

    const inviteeSocket: string | undefined = this.userSocketRepository.find(invitation.inviteeId);
    const inviterSocket: string | undefined = this.userSocketRepository.find(invitation.inviterId);
    if (inviteeSocket !== userSocket.id) return this.sendInviteError(userSocket.id, '유효하지 않은 접근입니다');

    const data: EmitInviteConfirm = new EmitInviteConfirm(null);
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
