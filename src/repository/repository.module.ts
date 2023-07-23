import { Module } from '@nestjs/common';
import { UserSocketRepository } from './user-socket.repository';

@Module({
  providers: [UserSocketRepository],
  exports: [UserSocketRepository],
})
export class RepositoryModule {}
