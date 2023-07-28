import { Body, Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { LoginService } from './login.service';
import { ExtractUser } from '../common/decorators/extract-user.decorator';
import { User } from '../common/entities/user.entity';
import { AuthService } from '../auth/auth.service';
import { FtAuthGuard } from '../auth/ft/ft-auth.guard';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { UserService } from '../user/user.service';
import { AuthCodeDto } from './dto/auth-code.dto';
import { TwoFactorAuthGuard } from '../auth/two-factor/two-factor-auth.guard';

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
    if (user.isRegister) {
      if (user.isAuth) {
        const twoFactorToken = await this.authService.getTwoFactorToken(user.id);
        await this.authService.sendTwoFactorMail(user.email, user.id);
        res.cookie('two-factor-token', twoFactorToken).redirect('/two-factor');
      } else {
        const jwtToken = await this.authService.getJwtToken(user.id);
        await this.userService.updateRefreshToken(user.id, jwtToken.refreshToken);
        res
          .cookie('access-token', jwtToken.accessToken)
          .cookie('refresh-token', jwtToken.refreshToken)
          .redirect('http://localhost:5173/signin/oauth');
      }
    } else {
      const registedUserId = await this.loginService.register(user);
      const jwtToken = await this.authService.getJwtToken(registedUserId);
      await this.userService.updateRefreshToken(registedUserId, jwtToken.refreshToken);
      res
        .cookie('access-token', jwtToken.accessToken)
        .cookie('refresh-token', jwtToken.refreshToken)
        .redirect('http://localhost:5173/siginup/setprofile');
    }
  }

  @Post('2fa-auth/:id')
  @UseGuards(TwoFactorAuthGuard)
  async twoFactorAuth(@Param('id') id: number, @Body() authCode: AuthCodeDto, @Res() res: Response) {
    await this.authService.checkCode(id.toString(), authCode.code);
    const jwtToken = await this.authService.getJwtToken(id);
    await this.userService.updateRefreshToken(id, jwtToken.refreshToken);
    res
      .clearCookie('two-factor-token')
      .cookie('access-token', jwtToken.accessToken)
      .cookie('refresh-token', jwtToken.refreshToken)
      .send();
  }
}
