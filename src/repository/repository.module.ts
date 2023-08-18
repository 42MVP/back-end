import { Module } from '@nestjs/common';
import { UserSocketRepository } from './user-socket.repository';
import { MuteTimeRepository } from './mute-time.repository';
import { QueueRepository } from './queue.repository';
import { MatchingRepository } from './matching.repository';

@Module({
  providers: [UserSocketRepository, MuteTimeRepository, QueueRepository, MatchingRepository],
  exports: [UserSocketRepository, MuteTimeRepository, QueueRepository, MatchingRepository],
})
export class RepositoryModule {}
