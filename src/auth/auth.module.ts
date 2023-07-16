import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FtAuthStrategy } from './ft/ft-auth.strategy';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthStrategy } from './jwt/jwt-auth.strategy';
import { UserModule } from 'src/user/user.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { mailerConfig } from 'src/configs/mailer.config';
import { CacheModule } from '@nestjs/cache-manager';
import { cacheConfig } from 'src/configs/cache.config';
import { TwoFactorAuthStrategy } from './two-factor/two-factor-auth.strategy';

@Module({
  imports: [
    JwtModule.register({}),
    UserModule,
    MailerModule.forRootAsync(mailerConfig),
    CacheModule.registerAsync(cacheConfig),
  ],
  providers: [AuthService, FtAuthStrategy, JwtAuthStrategy, TwoFactorAuthStrategy],
  exports: [AuthService],
})
export class AuthModule {}
