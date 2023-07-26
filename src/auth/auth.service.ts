import { MailerService } from '@nestjs-modules/mailer';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Cache } from 'cache-manager';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private async getJwtAccessToken(id: number): Promise<string> {
    const payload = { sub: id };
    const signOptions = {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN'),
    };
    return await this.jwtService.signAsync(payload, signOptions);
  }

  private async getJwtRefreshToken(id: number): Promise<string> {
    const payload = { sub: id };
    const signOptions = {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
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
      expiresIn: this.configService.get<string>('TWO_FACTOR_EXPIRES_IN'),
    };
    return await this.jwtService.signAsync(payload, signOptions);
  }

  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async sendTwoFactorMail(email: string, id: number): Promise<void> {
    const code = this.getRandomCode();

    await this.mailerService
      .sendMail({
        to: email,
        from: 'nobil2474@naver.com',
        subject: '42MVP 인증 메일',
        html: `<h1>인증 코드: [${code}]</h1>`,
      })
      .catch(e => {
        console.log(e);
        throw new InternalServerErrorException('메일 발송에 실패했습니다!');
      });

    await this.cacheManager.set(id.toString(), code);
    console.log(id.toString());
    console.log(await this.cacheManager.get(id.toString()));
  }

  getRandomCode(): string {
    return Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
  }

  async checkCode(id: string, code: string) {
    const cacheCode: string = await this.cacheManager.get(id);
    console.log(id);
    console.log(cacheCode);
    if (cacheCode === undefined) {
      throw new ForbiddenException('유효하지 않은 인증 입니다!');
    }
    if (cacheCode != code) {
      throw new UnauthorizedException('인증 코드가 틀렸습니다!');
    }
    await this.cacheManager.del(id);
  }
}
