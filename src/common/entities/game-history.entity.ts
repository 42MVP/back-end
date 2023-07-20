import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class GameHistory extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)' })
  created_at: Date;

  @Column({ type: 'int', default: 0 })
  winnerScore: number;

  @Column({ type: 'int', default: 0 })
  loserScore: number;

  @ManyToOne(() => User, user => user.gameHistories, { onDelete: 'CASCADE' })
  winner: number;

  @ManyToOne(() => User, user => user.gameHistories, { onDelete: 'CASCADE' })
  loser: number;
}
