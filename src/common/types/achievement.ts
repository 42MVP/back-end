import { EAchievement } from '../enums';

export class Achievement {
  private readonly name: EAchievement;
  private readonly description: string;
  private readonly image: string;

  private constructor(name: EAchievement, description: string, image: string) {
    this.name = name;
    this.description = description;
    this.image = image;
  }

  public static getTenWins(): Readonly<Achievement> {
    return Object.freeze(new Achievement(EAchievement.TEN_WINS, '10번 승리하면 얻을 수 있는 업적 입니다!', ''));
  }
}
