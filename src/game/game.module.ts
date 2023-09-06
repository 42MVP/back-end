import { Module } from '@nestjs/common';
import { PreGameModule } from './pre-game/pre-game.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameHistory } from 'src/common/entities/game-history.entity';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { RepositoryModule } from 'src/repository/repository.module';
import { GameController } from './game.controller';
import { User } from 'src/common/entities/user.entity';
import { GameRatingService } from './game-rating/game-rating.service';

@Module({
  imports: [PreGameModule, TypeOrmModule.forFeature([GameHistory, User]), RepositoryModule],
  providers: [GameGateway, GameService, GameRatingService],
  controllers: [GameController],
})
export class GameModule {}
