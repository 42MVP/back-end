import { Module } from '@nestjs/common';
import { UserSocketRepository } from './user-socket.repository';
import { MuteTimeRepository } from './mute-time.repository';

@Module({
  providers: [UserSocketRepository, MuteTimeRepository],
  exports: [UserSocketRepository, MuteTimeRepository],
})
export class RepositoryModule {}
