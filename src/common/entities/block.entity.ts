import { BaseEntity, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Block extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.friendships, { onDelete: 'CASCADE' })
  from: number;

  @ManyToOne(() => User, user => user.friendships, { onDelete: 'CASCADE' })
  to: number;
}
