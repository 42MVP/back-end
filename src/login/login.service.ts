import { Injectable } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { User } from 'src/database/entities/user.entity';
import { UserService } from 'src/user/user.service';
@Injectable()
export class LoginService {
  constructor(private readonly userService: UserService, private readonly authService: AuthService) {}

  async getRedirectUrl(user: User, refreshToken: string): Promise<string> {
    const foundUser = await this.userService.findOneByIntraId(user.intraId);
    if (!this.isRegister(foundUser)) {
      if (!foundUser) {
        await this.register(user, refreshToken);
      }
      return '/register';
    }
    if (foundUser.isAuth) {
      return '2fa';
    }
    return '/';
  }

  isRegister(user: User): boolean {
    if (!user || user.userName === null) return false;
    return true;
  }

  async register(user: User, refreshToken: string): Promise<void> {
    user.refreshToken = refreshToken;
    await this.userService.create(user);
  }
}
