import { Module } from '@nestjs/common';
import { UserAchievementService } from './user-achievement.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAchievement } from 'src/common/entities/user-achievement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserAchievement])],
  providers: [UserAchievementService],
  exports: [UserAchievementService],
})
export class UserAchievementModule {}
