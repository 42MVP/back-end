import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FtAuthStrategy } from './ft/ft-auth.strategy';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthStrategy } from './jwt/jwt-auth.strategy';
import { UserModule } from 'src/user/user.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { mailerConfig } from 'src/configs/mailer.config';

@Module({
  imports: [JwtModule.register({}), UserModule, MailerModule.forRootAsync(mailerConfig)],
  providers: [AuthService, FtAuthStrategy, JwtAuthStrategy],
  exports: [AuthService],
})
export class AuthModule {}
