import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-42';
import { ConfigService } from '@nestjs/config';
import { FtProfile } from '../../common/types/ftProfile';
import { UserService } from 'src/user/user.service';
import { User } from 'src/common/entities/user.entity';

@Injectable()
export class FtAuthStrategy extends PassportStrategy(Strategy, 'ft-auth') {
  constructor(private readonly configService: ConfigService, private readonly userService: UserService) {
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
    try {
      const user: User = await this.userService.findOneByIntraId(profile.username);
      profile.isRegister = true;
      profile.isAuth = user.isAuth;
      profile.indexId = user.id;
    } catch (NotFoundException) {
      profile.isRegister = false;
    }
    return profile;
  }
}
