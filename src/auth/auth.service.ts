import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {}

  private async getJwtAccessToken(id: number): Promise<string> {
    const payload = { sub: id };
    const signOptions = {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION'),
    };
    return await this.jwtService.signAsync(payload, signOptions);
  }

  private async getJwtRefreshToken(id: number): Promise<string> {
    const payload = { sub: id };
    const signOptions = {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION'),
    };
    return await this.jwtService.signAsync(payload, signOptions);
  }

  async getJwtToken(id: number): Promise<Record<string, string>> {
    const accessToken = await this.getJwtAccessToken(id);
    const refreshToken = await this.getJwtRefreshToken(id);
    return { accessToken: accessToken, refreshToken: refreshToken };
  }

  async getTwoFactorToken(id: number): Promise<string> {
    const payload = { sub: id };
    const signOptions = {
      secret: this.configService.get<string>('TWO_FACTOR_SECRET'),
      expiresIn: this.configService.get<string>('TWO_FACTOR_EXPIRATION'),
    };
    return await this.jwtService.signAsync(payload, signOptions);
  }

  async sendTwoFactorMail(email: string): Promise<void> {
    this.mailerService
      .sendMail({
        to: email,
        from: 'nobil2474@naver.com',
        subject: '42MVP 인증 메일',
        html: '<b>hi</b>',
      })
      .catch(e => {
        console.log(e);
        throw new InternalServerErrorException('메일 발송에 실패했습니다!');
      });
  }
}
