import { Body, Controller, Get, UseGuards } from '@nestjs/common';
import { GameService } from './game.service';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { ExtractId } from 'src/common/decorators/extract-id.decorator';

@Controller('game')
@UseGuards(JwtAuthGuard)
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get('finish')
  async getGameHistory(@ExtractId() userId: number, @Body() gameHistoryId: number) {
    return await this.gameService.getGameHistory(userId, gameHistoryId);
  }
}
