import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/database/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService, private readonly configService: ConfigService) {}

  private async getJwtAccessToken(user: User): Promise<string> {
    const payload = { sub: user.intraId, email: user.email };
    const signOptions = {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION'),
    };
    return await this.jwtService.signAsync(payload, signOptions);
  }

  private async getJwtRefreshToken(user: User): Promise<string> {
    const payload = { sub: user.intraId, email: user.email };
    const signOptions = {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION'),
    };
    return await this.jwtService.signAsync(payload, signOptions);
  }

  async getJwtToken(user: User): Promise<Record<string, string>> {
    const accessToken = await this.getJwtAccessToken(user);
    const refreshToken = await this.getJwtRefreshToken(user);
    return { accessToken: accessToken, refreshToken: refreshToken };
  }

  async getTwoFactorToken(user: User): Promise<string> {
    const payload = { sub: user.intraId, email: user.email };
    const signOptions = {
      secret: this.configService.get<string>('TWO_FACTOR_SECRET'),
      expiresIn: this.configService.get<string>('TWO_FACTOR_EXPIRATION'),
    };
    return await this.jwtService.signAsync(payload, signOptions);
  }
}
