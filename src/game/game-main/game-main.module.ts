import { Module } from '@nestjs/common';
import { GameMainGateway } from './game-main.gateway';
import { GameHistoryModule } from 'src/game-history/game-history.module';
import { RepositoryModule } from 'src/repository/repository.module';
import { GameRatingService } from '../game-rating/game-rating.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/common/entities/user.entity';

@Module({
  imports: [GameHistoryModule, RepositoryModule, TypeOrmModule.forFeature([User])],
  providers: [GameMainGateway, GameRatingService],
  exports: [GameMainGateway],
})
export class GameMainModule {}
