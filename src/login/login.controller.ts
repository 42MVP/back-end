import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
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
import { ExtractId } from 'src/common/decorators/extract-id.decorator';
import { ConfigService } from '@nestjs/config';

@Controller()
export class LoginController {
  constructor(
    private readonly loginService: LoginService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  @Get('login')
  @UseGuards(JwtAuthGuard)
  login(): void {
    return;
  }

  @Get('login/ft')
  @UseGuards(FtAuthGuard)
  ftLogin(): void {
    return;
  }

  @Get('login/redirect')
  @UseGuards(FtAuthGuard)
  async ftLoginRedirect(@ExtractUser() user: User, @Res() res: Response): Promise<void> {
    const frontEndUri = this.configService.get<string>('FRONTEND_URI');
    if (user.isRegister) {
      if (user.isAuth) {
        const twoFactorToken = await this.authService.getTwoFactorToken(user.id);
        await this.authService.sendTwoFactorMail(user.email, user.id);
        res.redirect(`http://${frontEndUri}/signIn/2fa-auth?token=${twoFactorToken}`);
      } else {
        const jwtToken = await this.authService.getJwtToken(user.id);
        await this.userService.updateRefreshToken(user.id, jwtToken.refreshToken);
        res
          .cookie('RefreshToken', jwtToken.refreshToken, { httpOnly: true })
          .redirect(`http://${frontEndUri}/signin/oauth?token=${jwtToken.accessToken}`);
      }
    } else {
      const registedUserId = await this.loginService.register(user);
      const jwtToken = await this.authService.getJwtToken(registedUserId);
      await this.userService.updateRefreshToken(registedUserId, jwtToken.refreshToken);
      res
        .cookie('RefreshToken', jwtToken.refreshToken, { httpOnly: true })
        .redirect(`http://${frontEndUri}/signup/setprofile?name=${user.userName}&token=${jwtToken.accessToken}`);
    }
  }

  @Post('login/2fa-auth')
  @UseGuards(TwoFactorAuthGuard)
  async twoFactorAuth(@ExtractId() id: number, @Body() authCode: AuthCodeDto, @Res() res: Response) {
    await this.authService.checkCode(id.toString(), authCode.code);
    const jwtToken = await this.authService.getJwtToken(id);
    await this.userService.updateRefreshToken(id, jwtToken.refreshToken);
    res.cookie('RefreshToken', jwtToken.refreshToken, { httpOnly: true }).send(jwtToken.accessToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@ExtractId() id: number) {
    await this.userService.updateRefreshToken(id, '');
  }
}
