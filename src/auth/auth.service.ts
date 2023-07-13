import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/database/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService, private readonly configService: ConfigService) {}

  async getJwtToken(user: User): Promise<string> {
    const payload = { sub: user.intraId, email: user.email };
    return await this.jwtService.signAsync(payload);
  }
}
