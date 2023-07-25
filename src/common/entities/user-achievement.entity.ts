import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { EAchievement } from '../enums';
import { Achievement } from 'src/user-achievement/achievement';

@Entity()
export class UserAchievement extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @ManyToOne(() => User, user => user.id, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'enum', enum: EAchievement, nullable: false })
  achievement: EAchievement;

  public toAchievement() {
    if (this.achievement == EAchievement.TEN_WINS) {
      return Achievement.getTenWins();
    }
  }
}
