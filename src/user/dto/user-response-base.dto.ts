import { User } from 'src/common/entities/user.entity';

export class UserResponseBaseDto {
  constructor(user: User) {
    this.id = user.id;
    this.name = user.userName;
    this.avatarURL = user.avatar;
    this.achievements = [0, 1, 4];
    this.winNum = user.winNum;
    this.loseNum = user.loseNum;
    this.rate = user.rating;
  }

  id: number;
  name: string;
  avatarURL: string;
  achievements: number[];
  winNum: number;
  loseNum: number;
  rate: number;
}
