import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/common/entities/user.entity';
import { RepositoryModule } from 'src/repository/repository.module';
import { GameInvitationController } from './game-invitation.controller';
import { GameInvitationGateway } from './game-invitation.gateway';
import { GameInvitationService } from './game-invitation.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), RepositoryModule],
  controllers: [GameInvitationController],
  providers: [GameInvitationService, GameInvitationGateway],
  exports: [GameInvitationGateway],
})
export class GameInvitationModule {}
