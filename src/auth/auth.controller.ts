import { Controller, Get, Res, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { ExtractId } from 'src/common/decorators/extract-id.decorator';
import { JwtRefreshGuard } from './jwt/jwt-refresh.guard';
import { UserService } from 'src/user/user.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private readonly userService: UserService) {}

  @Get('reissue')
  @UseGuards(JwtRefreshGuard)
  async reissue(@Req() req: Request, @Res() res: Response, @ExtractId() id: number): Promise<void> {
    const reqToken: string = req.cookies['RefreshToken'];
    const savedToken: string = (await this.userService.findOneById(id)).refreshToken;
    if (reqToken != savedToken) {
      throw new UnauthorizedException('잘못된 Refresh Token 입니다!');
    }
    res.send(await this.authService.getJwtAccessToken(id));
  }
}
