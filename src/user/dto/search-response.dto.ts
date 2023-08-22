import { User } from 'src/common/entities/user.entity';

export class SearchResponseDto {
  constructor(user: User) {
    this.id = user.id;
    this.name = user.userName;
    this.avatarURL = user.avatar;
  }

  id: number;
  name: string;
  avatarURL: string;
}
