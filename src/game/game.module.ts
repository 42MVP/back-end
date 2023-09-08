import { Module } from '@nestjs/common';
import { PreGameModule } from './pre-game/pre-game.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameHistory } from 'src/common/entities/game-history.entity';
import { GameGateway } from './game.gateway';
import { RepositoryModule } from 'src/repository/repository.module';
import { User } from 'src/common/entities/user.entity';
import { GameRatingService } from './game-rating/game-rating.service';
import { GameMainModule } from './game-main/game-main.module';
import { GameHistoryModule } from 'src/game-history/game-history.module';

@Module({
  imports: [
    PreGameModule,
    TypeOrmModule.forFeature([GameHistory, User]),
    RepositoryModule,
    GameMainModule,
    GameHistoryModule,
  ],
  providers: [GameGateway, GameRatingService],
})
export class GameModule {}
