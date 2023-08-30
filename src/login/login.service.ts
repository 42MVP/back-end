import { Injectable } from '@nestjs/common';
import { User } from '../common/entities/user.entity';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoginService {
  constructor(private readonly userService: UserService, private readonly configService: ConfigService) {}

  async register(user: User): Promise<number> {
    user.userName = user.intraId;
    user.avatar = this.configService.get('AWS_S3_DEFAULT_AVATAR');
    return (await this.userService.create(user)).id;
  }
}
