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
export class Friendship extends BaseEntity {
  constructor(from: number, to: number) {
    super();
    this.fromId = from;
    this.toId = to;
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  toId: number;

  @Column({ type: 'int' })
  fromId: number;

  @ManyToOne(() => User, user => user.id, { onDelete: 'CASCADE' })
  from: User;

  @ManyToOne(() => User, user => user.id, { onDelete: 'CASCADE' })
  to: User;

  @BeforeInsert()
  @BeforeUpdate()
  checkFieldValues() {
    if (this.fromId === this.toId) {
      throw new ConflictException('자기 자신을 친구로 등록할 수 없습니다!');
    }
  }
}
