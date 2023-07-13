import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { UserStatus } from './enums';
import { UpdateUserDto } from 'src/user/dto/update-user.dto';

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

  @Column({ type: 'varchar', nullable: false })
  refreshToken: string;

  status: UserStatus;

  static from(requestUser): User {
    const user = new User();
    user.intraId = requestUser.username;
    user.isAuth = false;
    user.email = requestUser.emails[0].value;
    return user;
  }

  update(updateUserDto: UpdateUserDto) {
    this.userName = updateUserDto.userName;
    this.avatar = updateUserDto.avatar;
  }
}
