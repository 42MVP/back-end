import { Injectable } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { User } from 'src/database/entities/user.entity';
import { UserService } from 'src/user/user.service';

@Injectable()
export class LoginService {
  constructor(private readonly userService: UserService, private readonly authService: AuthService) {}

  async register(user: User): Promise<number> {
    user.userName = user.intraId;
    return (await this.userService.create(user)).id;
  }
}
