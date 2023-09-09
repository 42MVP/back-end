import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/common/entities/user.entity';
import { RepositoryModule } from 'src/repository/repository.module';
import { GameInvitationController } from './game-invitation.controller';
import { GameInvitationGateway } from './game-invitation.gateway';
import { GameInvitationService } from './game-invitation.service';
import { GameHistory } from 'src/common/entities/game-history.entity';
import { GameConnectGateway } from '../game-connect.gateway';
import { GameHistoryModule } from 'src/game-history/game-history.module';
import { GameMainModule } from 'src/game/game-main/game-main.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, GameHistory]), RepositoryModule, GameMainModule, GameHistoryModule],
  controllers: [GameInvitationController],
  providers: [GameInvitationService, GameInvitationGateway, GameConnectGateway],
  exports: [GameInvitationGateway],
})
export class GameInvitationModule {}
