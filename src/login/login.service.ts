import { Injectable } from '@nestjs/common';
import { User } from 'src/database/entities/user.entity';
import { UserService } from 'src/user/user.service';
@Injectable()
export class LoginService {
  constructor(private readonly userService: UserService) {}

  async isRegister(intraId: string): Promise<boolean> {
    const user: User = await this.userService.findOneByIntraId(intraId);
    if (!user || user.userName === undefined) {
      return false;
    }
    return true;
  }

  async register(user: User): Promise<boolean> {
    console.log(user.intraId);
    let find: User = await this.userService.findOneByIntraId(user.intraId);
    if (find) {
      return true;
    }
    find = new User();

    return false;
  }
}
