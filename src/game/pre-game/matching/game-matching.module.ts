import { Module } from '@nestjs/common';
import { GameMatchingService } from './game-matching.service';
import { GameMatchingGateway } from './game-matching.gateway';
import { GameMatchingController } from './game-matching.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { RepositoryModule } from 'src/repository/repository.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/common/entities/user.entity';
import { GameHistory } from 'src/common/entities/game-history.entity';
import { GameConnectGateway } from '../game-connect.gateway';
import { GameRatingService } from 'src/game/game-rating/game-rating.service';
import { GameHistoryModule } from 'src/game-history/game-history.module';
import { GameMainModule } from 'src/game/game-main/game-main.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, GameHistory]),
    ScheduleModule.forRoot(),
    RepositoryModule,
    GameMainModule,
    GameHistoryModule,
  ],
  controllers: [GameMatchingController],
  providers: [GameMatchingGateway, GameMatchingService, GameConnectGateway, GameRatingService],
  exports: [GameMatchingGateway],
})
export class GameMatchingModule {}
