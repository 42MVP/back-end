import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { User } from '../common/entities/user.entity';
import { UserService } from '../user/user.service';

@Injectable()
export class LoginService {
  constructor(private readonly userService: UserService, private readonly authService: AuthService) {}

  async register(user: User): Promise<number> {
    user.userName = user.intraId;
    return (await this.userService.create(user)).id;
  }
}
