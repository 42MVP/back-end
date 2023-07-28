import { Controller, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { ExtractId } from 'src/common/decorators/extract-id.decorator';
import { JwtRefreshGuard } from './jwt/jwt-refresh.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('reissue')
  @UseGuards(JwtRefreshGuard)
  async reissue(@Res() res: Response, @ExtractId() id: number): Promise<void> {
    res.cookie('access-token', this.authService.getJwtAccessToken(id)).send();
  }
}
