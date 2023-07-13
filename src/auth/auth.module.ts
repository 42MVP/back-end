import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FtAuthStrategy } from './ft/ft-auth.strategy';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET_KEY'),
        signOptions: { expiresIn: '10s' },
      }),
    }),
  ],
  providers: [AuthService, FtAuthStrategy],
})
export class AuthModule {}
