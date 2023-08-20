import { Module } from '@nestjs/common';
import { UserSocketRepository } from './user-socket.repository';
import { MuteTimeRepository } from './mute-time.repository';
import { QueueRepository } from './queue.repository';
import { MatchingRepository } from './matching.repository';
import { GameRepository } from './game.repository';
import { InvitationRepository } from './invitation.repository';

@Module({
  providers: [
    UserSocketRepository,
    MuteTimeRepository,
    QueueRepository,
    MatchingRepository,
    GameRepository,
    InvitationRepository,
  ],
  exports: [
    UserSocketRepository,
    MuteTimeRepository,
    QueueRepository,
    MatchingRepository,
    GameRepository,
    InvitationRepository,
  ],
})
export class RepositoryModule {}
