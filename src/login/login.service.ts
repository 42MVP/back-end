import { Injectable } from '@nestjs/common';
import { User } from 'src/database/entities/user.entity';
import { UserService } from 'src/user/user.service';
@Injectable()
export class LoginService {
  constructor(private readonly userService: UserService) {}

  async getRedirectUrl(user: User): Promise<string> {
    const foundUser = await this.userService.findOneByIntraId(user.intraId);
    if (await this.isRegister(foundUser)) {
      if (foundUser.isAuth) {
        return '/2fa';
      }
      return '/';
    }
    await this.register(user);
    return '/register';
  }

  async isRegister(user: User): Promise<boolean> {
    if (!user || user.userName === undefined) return false;
    return true;
  }

  async register(user: User): Promise<void> {
    this.userService.create(user);
  }
}
