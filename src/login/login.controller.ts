import { Controller, Get, UseGuards } from '@nestjs/common';
import { LoginService } from './login.service';
import { FtAuthGuard } from 'src/auth/ft/ft-auth.guard';

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
  loginRedirect() {
    return;
  }
}
