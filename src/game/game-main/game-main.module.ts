import { Module } from '@nestjs/common';
import { GameMainGateway } from './game-main.gateway';
import { GameHistoryModule } from 'src/game-history/game-history.module';
import { RepositoryModule } from 'src/repository/repository.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/common/entities/user.entity';
import { GameRatingModule } from '../game-rating/game-rating.module';

@Module({
  imports: [GameHistoryModule, RepositoryModule, TypeOrmModule.forFeature([User]), GameRatingModule],
  providers: [GameMainGateway],
  exports: [GameMainGateway],
})
export class GameMainModule {}
