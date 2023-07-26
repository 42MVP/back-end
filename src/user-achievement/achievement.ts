import { UserAchievement } from 'src/common/entities/user-achievement.entity';
import { EAchievement } from '../common/enums';

export class Achievement {
  private readonly name: EAchievement;
  private readonly description: string;
  private readonly image: string;

  private constructor(name: EAchievement, description: string, image: string) {
    this.name = name;
    this.description = description;
    this.image = image;
  }

  public static getTenWins(): Achievement {
    return new Achievement(EAchievement.TEN_WINS, '10번 승리하면 얻을 수 있는 업적 입니다!', '');
  }

  public static map(userAchievements: UserAchievement[]): Achievement[] {
    const result: Achievement[] = [];

    for (const ua of userAchievements) {
      const a: Achievement = ua.toAchievement();
      console.log(a.name);
      result.push(a);
    }

    return result;
  }
}
