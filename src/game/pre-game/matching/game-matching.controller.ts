import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { ExtractId } from 'src/common/decorators/extract-id.decorator';
import { GameMatchingService } from './game-matching.service';
import { GameModePipe } from '../game-mode.pipe';

@Controller('game-matching')
export class GameMatchingController {
  constructor(private readonly gameMatchingService: GameMatchingService) {}

  @Post('queue/:mode')
  @UseGuards(JwtAuthGuard)
  applyQueue(@ExtractId() userId: number, @Param('mode', GameModePipe) gameMode: number): Promise<void> {
    console.log('in-queue: ', userId);
    return this.gameMatchingService.applyQueue(userId, gameMode);
  }

  @Post('cancel-queue')
  @UseGuards(JwtAuthGuard)
  cancelQueue(@ExtractId() userId: number): Promise<void> {
    console.log('cancel-queue: ', userId);
    return this.gameMatchingService.cancelQueue(userId);
  }
}
