import { Controller, Get, UseGuards } from '@nestjs/common';
import { LoginService } from './login.service';
import { FtAuthGuard } from 'src/auth/ft/ft-auth.guard';
import { ExtractUser } from 'src/auth/extract-user.decorator';
import { User } from 'src/database/entities/user.entity';

@Controller('login')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @Get()
  @UseGuards(FtAuthGuard)
  login(): void {
    return;
  }

  @Get('redirect')
  @UseGuards(FtAuthGuard)
  async loginRedirect(@ExtractUser() user: User) {
    console.log(user);
  }
}
