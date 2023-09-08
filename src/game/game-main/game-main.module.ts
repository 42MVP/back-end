import { Module } from '@nestjs/common';
import { GameMainGateway } from './game-main.gateway';

@Module({
  providers: [GameMainGateway],
})
export class GameMainModule {}
