import { Controller, Param, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { ExtractId } from 'src/common/decorators/extract-id.decorator';
import { GameInvitationService } from './game-invitation.service';
import { Invitation, InvitationRepository } from 'src/repository/invitation.repository';

@Controller('game-invitation')
export class GameInvitationController {
  constructor(
    private readonly gameInvitationService: GameInvitationService,
    private readonly invitationRepository: InvitationRepository,
  ) {}

  @Post('invite/:id')
  @UseGuards(JwtAuthGuard)
  inviteUser(@ExtractId() inviterId: number, @Param('id') inviteeId: number): Promise<number> {
    console.log('inviter: ', inviterId);
    console.log('invitee: ', inviteeId);
    return this.gameInvitationService.invite({ inviter: inviterId, invitee: inviteeId });
  }

  @Post('cancel-invite/:invitationId')
  @UseGuards(JwtAuthGuard)
  cancelinviteUser(@ExtractId() userId: number, @Param('invitationId') invitationId: number): Promise<boolean> {
    console.log('cancel invite');
    const invitation: Invitation = this.invitationRepository.find(invitationId);
    if (invitation.inviterId !== userId) throw new UnauthorizedException('접근 권한이 없습니다');

    return this.gameInvitationService.cancelInvite(invitationId, invitation);
  }
}
