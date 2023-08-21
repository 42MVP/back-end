import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/common/entities/user.entity';
import { Repository } from 'typeorm';
import { GameInvitationGateway } from './game-invitation.gateway';
import { InvitationRepository } from 'src/repository/invitation.repository';
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

  async invite(ids: { inviter: number; invitee: number }): Promise<void> {
    const inviterState = this.userStateRepository.find(ids.inviter);
    const inviteeState = this.userStateRepository.find(ids.invitee);

    if (inviterState !== UserState.IDLE || inviteeState !== UserState.IDLE) throw new BadRequestException('초대 불가');
    const inviter: User = await this.userRepository.findOne({ where: { id: ids.inviter } });
    const invitationId = this.invitationRepository.save({
      inviterId: ids.inviter,
      inviteeId: ids.invitee,
      time: new Date(),
    });
    const isSuccess = this.gameInvitationGateway.sendInvite(
      {
        id: inviter.id,
        avatarUrl: '',
        userName: inviter.userName,
      },
      ids.invitee,
      invitationId,
    );
    if (!isSuccess) this.invitationRepository.delete(invitationId);
    this.userStateRepository.update(ids.invitee, UserState.IN_INVITATION);
    this.userStateRepository.update(ids.inviter, UserState.IN_INVITATION);

    return;
  }
}
