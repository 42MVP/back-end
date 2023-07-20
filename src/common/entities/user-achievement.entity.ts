import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { EAchievement } from '../enums';

@Entity()
export class UserAchievement extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.userAchievement, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'enum', enum: EAchievement, nullable: false })
  achievement: EAchievement;
}
