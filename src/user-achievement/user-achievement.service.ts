import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserAchievement } from 'src/common/entities/user-achievement.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserAchievementService {
  constructor(
    @InjectRepository(UserAchievement)
    private userAchievementRepository: Repository<UserAchievement>,
  ) {}

  async getUserAchievements(id: number): Promise<UserAchievement[]> {
    return await this.userAchievementRepository.find({ where: { userId: id } });
  }
}
