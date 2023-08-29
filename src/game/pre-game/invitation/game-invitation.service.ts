import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/common/entities/user.entity';
import { Repository } from 'typeorm';
import { GameInvitationGateway } from './game-invitation.gateway';
import { Invitation, InvitationRepository } from 'src/repository/invitation.repository';
import { UserState, UserStateRepository } from 'src/repository/user-state.repository';

@Injectable()
export class GameInvitationService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly invitationRepository: InvitationRepository,
    private readonly gameInvitationGateway: GameInvitationGateway,
    private readonly userStateRepository: UserStateRepository,
  ) {}

  async invite(ids: { inviter: number; invitee: number }): Promise<number> {
    const inviterState = this.userStateRepository.find(ids.inviter);
    const inviteeState = this.userStateRepository.find(ids.invitee);

    if (inviterState !== UserState.IDLE || inviteeState !== UserState.IDLE) throw new BadRequestException('초대 불가');
    const inviter: User = await this.userRepository.findOne({ where: { id: ids.inviter } });
    const invitationId = this.invitationRepository.save({
      inviterId: ids.inviter,
      inviteeId: ids.invitee,
    });
    const isSuccess = this.gameInvitationGateway.sendInvite(
      {
        id: inviter.id,
        avatarUrl: '',
        userName: inviter.userName,
      },
      invitationId,
    );
    if (isSuccess) {
      this.userStateRepository.update(ids.invitee, UserState.IN_INVITATION);
      this.userStateRepository.update(ids.inviter, UserState.IN_INVITATION);
    } else {
      this.invitationRepository.delete(invitationId);
      throw new BadRequestException('접속 상태 체크 바람');
    }

    return invitationId;
  }

  async cancelInvite(invitationId: number, invitation: Invitation): Promise<boolean> {
    this.gameInvitationGateway.sendInviteCancel(invitation.inviteeId);
    this.userStateRepository.update(invitation.inviteeId, UserState.IDLE);
    this.userStateRepository.update(invitation.inviterId, UserState.IDLE);

    return this.invitationRepository.delete(invitationId);
  }
}
