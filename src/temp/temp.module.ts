import { Module } from '@nestjs/common';
import { GameRepository } from 'src/repository/game.repository';
import { TempGateway } from './temp.gateway';

@Module({
  providers: [TempGateway, GameRepository],
})
export class TempModule {}
