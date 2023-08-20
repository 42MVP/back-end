import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/common/entities/user.entity';
import { Repository } from 'typeorm';
import { GameInvitationGateway } from './game-invitation.gateway';
import { InvitationRepository } from 'src/repository/invitation.repository';

@Injectable()
export class GameInvitationService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly invitationRepository: InvitationRepository,
    private readonly gameInvitationGateway: GameInvitationGateway,
  ) {}

  async invite(ids: { inviter: number; invitee: number }): Promise<void> {
    // TODO: [게임, 큐, 매칭, 초대] 중에는 초대 받거나 받을 수 없음
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

    return;
  }
}
