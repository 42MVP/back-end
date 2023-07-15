import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { LoginService } from './login.service';
import { ExtractUser } from 'src/auth/decorators/extract-user.decorator';
import { User } from 'src/database/entities/user.entity';
import { AuthService } from 'src/auth/auth.service';
import { FtAuthGuard } from 'src/auth/ft/ft-auth.guard';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { UserService } from 'src/user/user.service';

@Controller('login')
export class LoginController {
  constructor(
    private readonly loginService: LoginService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  login(): void {
    return;
  }

  @Get('ft')
  @UseGuards(FtAuthGuard)
  ftLogin(): void {
    return;
  }

  @Get('redirect')
  @UseGuards(FtAuthGuard)
  async ftLoginRedirect(@ExtractUser() user: User, @Res() res: Response): Promise<void> {
    if (user.isAuth) {
      const twoFactorToken = await this.authService.getTwoFactorToken(user);
      res.cookie('two-factor-token', twoFactorToken).redirect('/two-factor');
    } else {
      const jwtToken = await this.authService.getJwtToken(user);
      res.cookie('access-token', jwtToken.accessToken).cookie('refresh-token', jwtToken.refreshToken);
      if (user.isRegister) {
        await this.userService.updateRefreshToken(user.id, jwtToken.refreshToken);
        res.redirect('/');
      } else {
        await this.loginService.register(user, jwtToken.refreshToken);
        res.redirect('/register');
      }
    }
  }
}
