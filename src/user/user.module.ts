import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../common/entities/user.entity';
import { GameHistoryModule } from '../game-history/game-history.module';
import { UserAchievementModule } from '../user-achievement/user-achievement.module';
import { FriendModule } from 'src/friend/friend.module';
import { BlockModule } from 'src/block/block.module';
import { Achievement } from 'src/common/entities/achievement.entity';
import { S3Module } from 'src/s3/s3.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Achievement]),
    // MulterModule.registerAsync({
    //   imports: [ConfigModule],
    //   useFactory: multerOptionsFactory,
    //   inject: [ConfigService],
    // }),
    GameHistoryModule,
    UserAchievementModule,
    forwardRef(() => FriendModule),
    forwardRef(() => BlockModule),
    S3Module,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
