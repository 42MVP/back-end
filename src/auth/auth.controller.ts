import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { ExtractId } from 'src/common/decorators/extract-id.decorator';
import { JwtRefreshGuard } from './jwt/jwt-refresh.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('reissue')
  @UseGuards(JwtRefreshGuard)
  async reissue(@Res() res: Response, @ExtractId() id: number): Promise<void> {
    res.send(await this.authService.getJwtAccessToken(id));
  }
}
