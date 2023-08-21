import { Module } from '@nestjs/common';
import { GameRepository } from 'src/repository/game.repository';
import { TempGateway } from './temp.gateway';
import { GameModule } from 'src/game/game.module';

@Module({
  imports: [GameModule],
  providers: [TempGateway, GameRepository],
})
export class TempModule {}
