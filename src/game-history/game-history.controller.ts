import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { ExtractId } from 'src/common/decorators/extract-id.decorator';
import { GameHistoryService } from './game-history.service';

@Controller('game')
@UseGuards(JwtAuthGuard)
export class GameHistoryController {
  constructor(private readonly gameService: GameHistoryService) {}

  @Get('game-history/:id')
  async getGameHistory(@ExtractId() userId: number, @Param('id') gameHistoryId: number) {
    return await this.gameService.sendGameHistory(userId, gameHistoryId);
  }
}
