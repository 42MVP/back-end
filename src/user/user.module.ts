import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../common/entities/user.entity';
import { GameHistoryModule } from '../game-history/game-history.module';
import { UserAchievementModule } from '../user-achievement/user-achievement.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), GameHistoryModule, UserAchievementModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
