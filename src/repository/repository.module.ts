import { Module } from '@nestjs/common';
import { UserSocketRepository } from './user-socket.repository';
import { MuteTimeRepository } from './mute-time.repository';
import { QueueRepository } from './queue.repository';
import { MatchingRepository } from './matching.repository';
import { GameRepository } from './game.repository';
import { InvitationRepository } from './invitation.repository';
import { UserStateRepository } from './user-state.repository';

@Module({
  providers: [
    UserSocketRepository,
    MuteTimeRepository,
    QueueRepository,
    MatchingRepository,
    GameRepository,
    InvitationRepository,
    UserStateRepository,
  ],
  exports: [
    UserSocketRepository,
    MuteTimeRepository,
    QueueRepository,
    MatchingRepository,
    GameRepository,
    InvitationRepository,
    UserStateRepository,
  ],
})
export class RepositoryModule {}
