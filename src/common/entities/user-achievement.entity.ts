import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { EAchievement } from '../enums';
import { Achievement } from '../../user-achievement/achievement';

@Entity()
export class UserAchievement extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'int' })
  achievementId: number;

  @ManyToOne(() => User, user => user.id, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => User, user => user.id, { onDelete: 'CASCADE' })
  achievement: Achievement;
}
