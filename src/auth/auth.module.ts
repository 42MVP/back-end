import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FtAuthStrategy } from './ft/ft-auth.strategy';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule.register({})],
  providers: [AuthService, FtAuthStrategy],
  exports: [AuthService],
})
export class AuthModule {}
