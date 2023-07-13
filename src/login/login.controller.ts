import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { LoginService } from './login.service';
import { FtAuthGuard } from 'src/auth/ft/ft-auth.guard';
import { ExtractUser } from 'src/auth/extract-user.decorator';
import { User } from 'src/database/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from 'src/auth/auth.service';

@Controller('login')
export class LoginController {
  constructor(private readonly loginService: LoginService, private readonly authService: AuthService) {}

  @Get()
  @UseGuards(FtAuthGuard)
  login(): void {
    return;
  }

  @Get('redirect')
  @UseGuards(FtAuthGuard)
  async loginRedirect(@ExtractUser() user: User, @Res() res: Response) {
    const token = await this.authService.getJwtToken(user);
    const redirectUrl = await this.loginService.getRedirectUrl(user);
    res.cookie('jwt-token', token).redirect(redirectUrl);
  }
}
