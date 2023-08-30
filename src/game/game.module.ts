import { Module } from '@nestjs/common';
import { PreGameModule } from './pre-game/pre-game.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameHistory } from 'src/common/entities/game-history.entity';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { RepositoryModule } from 'src/repository/repository.module';

@Module({
  imports: [PreGameModule, TypeOrmModule.forFeature([GameHistory]), RepositoryModule],
  providers: [GameGateway, GameService],
})
export class GameModule {}
