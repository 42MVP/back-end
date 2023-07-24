import {
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { BadRequestException } from '@nestjs/common';

@Entity()
@Unique(['toId', 'fromId'])
export class Friendship extends BaseEntity {
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

  @ManyToOne(() => User, user => user.friendships, { onDelete: 'CASCADE' })
  from: User;

  @ManyToOne(() => User, user => user.friendships, { onDelete: 'CASCADE' })
  to: User;

  @BeforeInsert()
  @BeforeUpdate()
  checkFieldValues() {
    if (this.fromId === this.toId) {
      throw new BadRequestException('자기 자신을 친구로 등록할 수 없습니다!');
    }
  }
}
