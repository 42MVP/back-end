import { Module } from '@nestjs/common';
import { GameRatingService } from './game-rating.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameHistory } from 'src/common/entities/game-history.entity';
import { User } from 'src/common/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GameHistory, User])],
  providers: [GameRatingService],
})
export class GameRatingModule {}
