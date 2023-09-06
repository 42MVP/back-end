import { Module } from '@nestjs/common';
import { GameInvitationModule } from './invitation/game-invitation.module';
import { GameMatchingModule } from './matching/game-matching.module';
import { GameIntervalService } from './game-interval.service';
import { RepositoryModule } from 'src/repository/repository.module';
import { GameRatingService } from '../game-rating/game-rating.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/common/entities/user.entity';

@Module({
  imports: [GameInvitationModule, GameMatchingModule, RepositoryModule, TypeOrmModule.forFeature([User])],
  controllers: [],
  providers: [GameIntervalService, GameRatingService],
})
export class PreGameModule {}
