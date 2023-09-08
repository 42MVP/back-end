import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/common/entities/user.entity';
import { RepositoryModule } from 'src/repository/repository.module';
import { GameInvitationController } from './game-invitation.controller';
import { GameInvitationGateway } from './game-invitation.gateway';
import { GameInvitationService } from './game-invitation.service';
import { GameHistory } from 'src/common/entities/game-history.entity';
import { GameGateway } from 'src/game/game.gateway';
import { GameConnectGateway } from '../game-connect.gateway';
import { GameRatingService } from 'src/game/game-rating/game-rating.service';
import { GameHistoryModule } from 'src/game-history/game-history.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, GameHistory]), RepositoryModule, GameHistoryModule],
  controllers: [GameInvitationController],
  providers: [GameInvitationService, GameInvitationGateway, GameGateway, GameConnectGateway, GameRatingService],
  exports: [GameInvitationGateway],
})
export class GameInvitationModule {}
