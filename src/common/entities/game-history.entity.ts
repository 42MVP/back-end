import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class GameHistory extends BaseEntity {
  constructor(winnerId: number, loserId: number, winnerScore: number, loserScore: number) {
    super();
    this.winnerId = winnerId;
    this.loserId = loserId;
    this.winnerScore = winnerScore;
    this.loserScore = loserScore;
  }

  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)' })
  created_at: Date;

  @Column({ type: 'int', default: 0 })
  winnerScore: number;

  @Column({ type: 'int', default: 0 })
  loserScore: number;

  @Column({ type: 'int' })
  winnerId: number;

  @Column({ type: 'int' })
  loserId: number;

  @ManyToOne(() => User, user => user.gameHistories, { onDelete: 'CASCADE', eager: true })
  winner: User;

  @ManyToOne(() => User, user => user.gameHistories, { onDelete: 'CASCADE', eager: true })
  loser: User;
}
