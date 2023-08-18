import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameHistory } from 'src/common/entities/game-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GameHistory])],
  providers: [GameGateway, GameService],
})
export class GameModule {}
