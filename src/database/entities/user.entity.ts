import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { UserStatus } from './enums';

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20, nullable: false, unique: true })
  intraId: string;

  @Column({ type: 'varchar', nullable: true, unique: true })
  userName: string;

  @Column({ type: 'boolean', default: false })
  isAuth: boolean;

  @Column({ type: 'bytea', nullable: true })
  avatar: Buffer;

  @Column({ type: 'varchar', nullable: true })
  email: string;

  status: UserStatus;

  // static from(createUserDto: CreateUserDto): User {
  //   const user = new User();
  //   user.intraId = createUserDto.intraId;
  //   user.userName = createUserDto.userName;
  //   user.password = createUserDto.password;
  //   user.isAuth = createUserDto.isAuth;
  //   user.avatar = createUserDto.avatar;
  //   user.email = createUserDto.email;
  //   return user;
  // }

  static from(requestUser): User {
    const user = new User();
    user.intraId = requestUser.username;
    user.isAuth = false;
    user.email = requestUser.emails[0].value;
    return user;
  }
}
