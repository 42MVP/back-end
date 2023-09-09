import { Module } from '@nestjs/common';
import { GameHistoryService } from './game-history.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameHistory } from '../common/entities/game-history.entity';
import { GameHistoryController } from './game-history.controller';
import { User } from 'src/common/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GameHistory, User])],
  controllers: [GameHistoryController],
  providers: [GameHistoryService],
  exports: [GameHistoryService],
})
export class GameHistoryModule {}
