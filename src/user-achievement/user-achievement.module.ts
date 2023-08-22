import { Module } from '@nestjs/common';
import { UserAchievementService } from './user-achievement.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAchievement } from '../common/entities/user-achievement.entity';
import { Achievement } from 'src/common/entities/achievement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Achievement, UserAchievement])],
  providers: [UserAchievementService],
  exports: [UserAchievementService],
})
export class UserAchievementModule {}
