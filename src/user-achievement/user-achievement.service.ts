import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserAchievement } from '../common/entities/user-achievement.entity';
import { Repository } from 'typeorm';
import { Achievement } from 'src/common/entities/achievement.entity';

@Injectable()
export class UserAchievementService {
  constructor(
    @InjectRepository(UserAchievement)
    private userAchievementRepository: Repository<UserAchievement>,
    @InjectRepository(Achievement)
    private achievementRepository: Repository<Achievement>,
  ) {}

  async getUserAchievements(id: number): Promise<UserAchievement[]> {
    return await this.userAchievementRepository.find({ where: { userId: id } });
  }

  async getAchievement(id: number): Promise<Achievement[]> {
    const ids: number[] = (await this.getUserAchievements(id)).map(userAchievement => {
      return userAchievement.achievementId;
    });
    const achievements: Achievement[] = await this.achievementRepository.find();
    achievements.forEach(achievement => {
      if (ids.includes(achievement.id)) {
        achievement.isAchieved = true;
      } else {
        achievement.isAchieved = false;
      }
    });
    return achievements;
  }
}
