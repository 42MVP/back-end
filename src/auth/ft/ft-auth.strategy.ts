import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FtAuthStrategy extends PassportStrategy(Strategy, 'ft-auth') {
  constructor(configService: ConfigService) {
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

  async validate(accessToken: string, refreshToken: string) {
    try {
      console.log('accessToken: ', accessToken);
      console.log('refreshToken: ', refreshToken);
      return accessToken;
    } catch (error) {
      console.log(error);
    }
  }
}
