import { Module } from '@nestjs/common';
import { GameInvitationModule } from './invitation/game-invitation.module';
import { GameMatchingModule } from './matching/game-matching.module';
import { GameIntervalService } from './game-interval.service';
import { RepositoryModule } from 'src/repository/repository.module';

@Module({
  imports: [GameInvitationModule, GameMatchingModule, RepositoryModule],
  controllers: [],
  providers: [GameIntervalService],
})
export class PreGameModule {}
