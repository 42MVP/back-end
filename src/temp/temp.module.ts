import { Module } from '@nestjs/common';
import { TempGateway } from './temp.gateway';
import { RepositoryModule } from 'src/repository/repository.module';
import { GameService } from 'src/game/game.service';
import { GameModule } from 'src/game/game.module';
import { GameGateway } from 'src/game/game.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameHistory } from 'src/common/entities/game-history.entity';

@Module({
  imports: [RepositoryModule, TypeOrmModule.forFeature([GameHistory]), GameModule],
  providers: [TempGateway, GameService, GameGateway],
})
export class TempModule {}
