import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { LoginService } from './login.service';
import { FtAuthGuard } from 'src/auth/ft/ft-auth.guard';
import { ExtractUser } from 'src/auth/extract-user.decorator';
import { User } from 'src/database/entities/user.entity';
import { AuthService } from 'src/auth/auth.service';

@UseGuards(FtAuthGuard)
@Controller('login')
export class LoginController {
  constructor(private readonly loginService: LoginService, private readonly authService: AuthService) {}

  @Get()
  login(): void {
    return;
  }

  @Get('redirect')
  async loginRedirect(@ExtractUser() user: User, @Res() res: Response) {
    const accessToken = await this.authService.getJwtAccessToken(user);
    const refreshToken = await this.authService.getJwtRefreshToken(user);
    const redirectUrl = await this.loginService.getRedirectUrl(user, refreshToken);
    res.cookie('access-token', accessToken).cookie('refresh-token', refreshToken).redirect(redirectUrl);
  }
}
