import { Injectable } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { User } from 'src/database/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { Response } from 'express';

@Injectable()
export class LoginService {
  constructor(private readonly userService: UserService, private readonly authService: AuthService) {}

  async getRedirectUrl(user: User, refreshToken: string): Promise<string> {
    let foundUser: User;
    try {
      foundUser = await this.userService.findOneByIntraId(user.intraId);
    } catch (NotFoundException) {
      await this.register(user, refreshToken);
      return '/register';
    }
    await this.userService.updateRefreshToken(foundUser.id, refreshToken);
    if (foundUser.isAuth) {
      return '/2fa';
    }
    return '/';
  }

  async register(user: User, refreshToken: string): Promise<void> {
    user.refreshToken = refreshToken;
    user.userName = user.intraId;
    await this.userService.create(user);
  }
}
