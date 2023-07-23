import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserStatus } from '../enums';
import { FtProfile } from 'src/common/types/ftProfile';
import { Friendship } from './friendship.entity';
import { GameHistory } from './game-history.entity';
import { UserAchievement } from './user-achievement.entity';

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20, nullable: false, unique: true })
  intraId: string;

  @Column({ type: 'varchar', nullable: false, unique: true })
  userName: string;

  @Column({ type: 'boolean', default: false })
  isAuth: boolean;

  @Column({ type: 'bytea', nullable: true })
  avatar: Buffer;

  @Column({ type: 'varchar', nullable: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  refreshToken: string;

  @Column({ type: 'int', default: 0 })
  winNum: number;

  @Column({ type: 'int', default: 0 })
  loseNum: number;

  @Column({ type: 'int', default: 0 })
  rating: number;

  @OneToMany(() => Friendship, friendship => friendship.from, { cascade: true, lazy: true })
  friendships: Promise<Friendship[]>;

  @OneToMany(() => GameHistory, gameHistory => gameHistory.winner, { cascade: true, lazy: true })
  gameHistories: Promise<GameHistory[]>;

  @OneToMany(() => UserAchievement, userAchievement => userAchievement.user, { cascade: true, lazy: true })
  userAchievement: Promise<UserAchievement[]>;

  status: UserStatus;

  isRegister: boolean;

  static from(requestUser: FtProfile): User {
    const user = new User();
    user.id = requestUser.indexId;
    user.intraId = requestUser.username;
    user.isAuth = requestUser.isAuth;
    user.email = requestUser.emails[0].value;
    user.isRegister = requestUser.isRegister;
    return user;
  }
}
