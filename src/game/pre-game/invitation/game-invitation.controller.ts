import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { ExtractId } from 'src/common/decorators/extract-id.decorator';
import { GameInvitationService } from './game-invitation.service';

@Controller('game-invitation')
export class GameInvitationController {
  constructor(private readonly gameInvitationService: GameInvitationService) {}

  @Post('invite/:id')
  @UseGuards(JwtAuthGuard)
  inviteUser(@ExtractId() inviterId: number, @Param('id') inviteeId: number): Promise<number> {
    console.log('inviter: ', inviterId);
    console.log('invitee: ', inviteeId);
    return this.gameInvitationService.invite({ inviter: inviterId, invitee: inviteeId });
  }
}
