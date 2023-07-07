import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FtAuthStrategy } from './ft/ft-auth.strategy';

@Module({
  providers: [AuthService, FtAuthStrategy],
})
export class AuthModule {}
