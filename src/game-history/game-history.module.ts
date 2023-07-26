import { Module } from '@nestjs/common';
import { GameHistoryService } from './game-history.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameHistory } from '../common/entities/game-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GameHistory])],
  providers: [GameHistoryService],
  exports: [GameHistoryService],
})
export class GameHistoryModule {}
