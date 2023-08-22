import { Module } from '@nestjs/common';
import { GameMatchingService } from './game-matching.service';
import { GameMatchingGateway } from './game-matching.gateway';
import { GameMatchingController } from './game-matching.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { RepositoryModule } from 'src/repository/repository.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/common/entities/user.entity';
import { GameHistory } from 'src/common/entities/game-history.entity';
import { GameGateway } from 'src/game/game.gateway';
import { GameService } from 'src/game/game.service';
import { GameConnectGateway } from '../game-connect.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([User, GameHistory]), ScheduleModule.forRoot(), RepositoryModule],
  controllers: [GameMatchingController],
  providers: [GameMatchingGateway, GameMatchingService, GameGateway, GameService, GameConnectGateway],
  exports: [GameMatchingGateway],
})
export class GameMatchingModule {}
