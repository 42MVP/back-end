import {
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ConflictException } from '@nestjs/common';

@Entity()
@Index(['toId', 'fromId'], { unique: true })
export class Block extends BaseEntity {
  constructor(from: number, to: number) {
    super();
    this.fromId = from;
    this.toId = to;
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'number' })
  toId: number;

  @Column({ type: 'number' })
  fromId: number;

  @ManyToOne(() => User, user => user.id, { onDelete: 'CASCADE' })
  from: number;

  @ManyToOne(() => User, user => user.id, { onDelete: 'CASCADE' })
  to: number;

  @BeforeInsert()
  @BeforeUpdate()
  checkFieldValues() {
    if (this.fromId === this.toId) {
      throw new ConflictException('자기 자신을 차단 할 수 없습니다!');
    }
  }
}
