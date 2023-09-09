import { Module } from '@nestjs/common';
import { PreGameModule } from './pre-game/pre-game.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameHistory } from 'src/common/entities/game-history.entity';
import { RepositoryModule } from 'src/repository/repository.module';
import { User } from 'src/common/entities/user.entity';
import { GameMainModule } from './game-main/game-main.module';
import { GameHistoryModule } from 'src/game-history/game-history.module';
import { GameRatingModule } from './game-rating/game-rating.module';

@Module({
  imports: [
    PreGameModule,
    TypeOrmModule.forFeature([GameHistory, User]),
    RepositoryModule,
    GameMainModule,
    GameRatingModule,
    GameHistoryModule,
  ],
})
export class GameModule {}
