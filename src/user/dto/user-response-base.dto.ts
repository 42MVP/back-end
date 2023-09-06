import { User } from 'src/common/entities/user.entity';

export class UserResponseBaseDto {
  constructor(user: User) {
    this.id = user.id;
    this.name = user.userName;
    this.email = user.email;
    this.avatarURL = user.avatar;
    this.winNum = user.winNum;
    this.loseNum = user.loseNum;
    this.rate = user.rating;
    this.state = undefined;
  }

  public updateState(state: string) {
    this.state = state;
  }

  id: number;
  name: string;
  email: string;
  avatarURL: string;
  winNum: number;
  loseNum: number;
  rate: number;
  state: string;
}
