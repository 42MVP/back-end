import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Invitation, InvitationRepository } from 'src/repository/invitation.repository';
import { UserSocketRepository } from 'src/repository/user-socket.repository';
// import { TempGateway } from 'src/temp/temp.gateway';

const GameInviteEvent = {
  invite: 'invite',
  inviteFailed: 'invite-failed',
  inviteSuccess: 'invite-success',
  inviteAccepted: 'invite-accepted',
  inviteRejected: 'invite-rejected',
  inviteTimeout: 'invite-timeout',
  inviteError: 'invite-error',
};

@WebSocketGateway()
export class GameInvitationGateway {
  constructor(
    private readonly invitationRepository: InvitationRepository,
    private readonly userSocketRepository: UserSocketRepository, // private readonly tempGateway: TempGateway
  ) {}

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('accept-invite')
  acceptInvite(@ConnectedSocket() userSocket: Socket, @MessageBody() acceptInviteDto: { invitationId: number }) {
    const invitation = this.invitationRepository.find(acceptInviteDto.invitationId);
    if (!invitation) {
      this.server.to(userSocket.id).emit(GameInviteEvent.inviteError, {
        msg: '유효하지 않는 초대입니다.',
      });
      return;
    }
    const inviteeSocket: string | undefined = this.userSocketRepository.find(invitation.inviteeId);
    const inviterSocket: string | undefined = this.userSocketRepository.find(invitation.inviterId);
    if (inviteeSocket !== userSocket.id) {
      this.server.to(userSocket.id).emit(GameInviteEvent.inviteError, {
        msg: '유효하지 않은 접근입니다',
      });
      return;
    }

    // GAME ID 보내기?
    if (inviterSocket) this.server.to(inviteeSocket).emit(GameInviteEvent.inviteAccepted);
    if (inviteeSocket) this.server.to(inviterSocket).emit(GameInviteEvent.inviteAccepted);
    this.invitationRepository.delete(acceptInviteDto.invitationId);
    //this.tempGateway.joinTestGameRoom(matching.challengers[0], user1Socket, matching.challengers[1], user2Socket);
  }

  @SubscribeMessage('reject-invite')
  rejectInvite(@ConnectedSocket() userSocket: Socket, @MessageBody() rejectInviteDto: { invitationId: number }) {
    const invitation = this.invitationRepository.find(rejectInviteDto.invitationId);
    if (!invitation) return;

    const inviteeSocket: string | undefined = this.userSocketRepository.find(invitation.inviteeId);
    const inviterSocket: string | undefined = this.userSocketRepository.find(invitation.inviterId);
    if (inviteeSocket !== userSocket.id) {
      this.server.to(userSocket.id).emit(GameInviteEvent.inviteError, {
        msg: '유효하지 않은 접근입니다',
      });
      return;
    }
    if (inviterSocket) this.server.to(inviterSocket).emit(GameInviteEvent.inviteRejected);

    this.invitationRepository.delete(rejectInviteDto.invitationId);
  }

  sendInvite(
    inviter: { id: number; avatarUrl: string; userName: string },
    inviteeId: number,
    invitationId: number,
  ): boolean {
    const inviteeSocket: string | undefined = this.userSocketRepository.find(inviteeId);
    const inviterSocket: string | undefined = this.userSocketRepository.find(inviter.id);

    if (!inviteeSocket) {
      this.server.to(inviterSocket).emit(GameInviteEvent.inviteFailed, {
        msg: '상대방이 접속중이지 않음.',
      });
      return false;
    } else if (!inviterSocket) {
      return false;
    }

    this.server.to(inviterSocket).emit(GameInviteEvent.inviteSuccess, {
      invitationId: invitationId,
    });
    this.server.to(inviteeSocket).emit(GameInviteEvent.invite, {
      inviterName: inviter.userName,
      inviterAvatarUrl: inviter.avatarUrl,
      invitationId: invitationId,
    });
    return true;
  }

  sendInviteTimeout(invitation: Invitation) {
    const inviterSocket: string | undefined = this.userSocketRepository.find(invitation.inviterId);

    if (inviterSocket)
      this.server.to(inviterSocket).emit(GameInviteEvent.inviteError, {
        msg: '상대가 제한 시간 내 초대를 받지 않음',
      });
  }
}
