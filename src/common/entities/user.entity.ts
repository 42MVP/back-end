import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { UserStatus } from '../enums';
import { FtProfile } from '../../common/types/ftProfile';
import { GameHistory } from './game-history.entity';
import { Achievement } from '../../user-achievement/achievement';

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
  avatar: string;

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

  gameHistories: GameHistory[];

  achievements: Achievement[];

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
