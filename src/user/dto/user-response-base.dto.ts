import { User } from 'src/common/entities/user.entity';
import { AchievementResponseDto } from './achievement-response.dto';

export class UserResponseBaseDto {
  constructor(user: User) {
    this.id = user.id;
    this.name = user.userName;
    this.email = user.email;
    this.avatarURL = user.avatar;
    this.achievements = user.achievements.map(achievement => new AchievementResponseDto(achievement));
    this.winNum = user.winNum;
    this.loseNum = user.loseNum;
    this.rate = user.rating;
  }

  id: number;
  name: string;
  email: string;
  avatarURL: string;
  achievements: AchievementResponseDto[];
  winNum: number;
  loseNum: number;
  rate: number;
}
