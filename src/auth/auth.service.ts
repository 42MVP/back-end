import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/database/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService, private readonly configService: ConfigService) {}

  async getJwtAccessToken(user: User): Promise<string> {
    const payload = { sub: user.intraId, email: user.email };
    const signOptions = {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION'),
    };
    return await this.jwtService.signAsync(payload, signOptions);
  }

  async getJwtRefreshToken(user: User): Promise<string> {
    const payload = { sub: user.intraId, email: user.email };
    const signOptions = {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION'),
    };
    return await this.jwtService.signAsync(payload, signOptions);
  }
}
