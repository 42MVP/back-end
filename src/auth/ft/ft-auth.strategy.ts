import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-42';
import { ConfigService } from '@nestjs/config';
import { FtProfile } from '../types';

@Injectable()
export class FtAuthStrategy extends PassportStrategy(Strategy, 'ft-auth') {
  constructor(private readonly configService: ConfigService) {
    super({
      authorizationURL: `https://api.intra.42.fr/oauth/authorize?client_id=${configService.get<string>(
        '42API_CLIENT_ID',
      )}&redirect_uri=${configService.get<string>('42API_REDIRECT_URI')},
      &response_type=code`,
      tokenURL: 'https://api.intra.42.fr/oauth/token',
      clientID: configService.get<string>('42API_CLIENT_ID'),
      clientSecret: configService.get<string>('42API_SECRET'),
      callbackURL: configService.get<string>('42API_REDIRECT_URI'),
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: FtProfile): Promise<FtProfile> {
    if (accessToken === undefined || refreshToken === undefined || profile.username === undefined) {
      throw new UnauthorizedException();
    }
    return profile;
  }
}
