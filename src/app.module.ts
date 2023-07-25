import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { typeORMConfig } from './configs/typeorm.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { LoginModule } from './login/login.module';
import { FriendModule } from './friend/friend.module';
import { BlockModule } from './block/block.module';
import { GameHistoryModule } from './game-history/game-history.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync(typeORMConfig),
    UserModule,
    AuthModule,
    LoginModule,
    FriendModule,
    BlockModule,
    GameHistoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
