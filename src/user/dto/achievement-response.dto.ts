import { Achievement } from 'src/common/entities/achievement.entity';

export class AchievementResponseDto {
  constructor(achievement: Achievement) {
    this.name = achievement.name;
    this.description = achievement.description;
    this.imageUrl = achievement.imageUrl;
    this.isAchieved = achievement.isAchieved;
  }

  name: string;
  description: string;
  imageUrl: string;
  isAchieved: boolean;
}
