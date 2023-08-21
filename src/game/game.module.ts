import { Module } from '@nestjs/common';
import { PreGameModule } from './pre-game/pre-game.module';

@Module({
  imports: [PreGameModule],
})
export class GameModule {}
