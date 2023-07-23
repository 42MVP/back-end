import { BaseEntity, BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { BadRequestException } from '@nestjs/common';

@Entity()
export class Friendship extends BaseEntity {
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
    if (this.from.id === this.to.id) {
      throw new BadRequestException('자기 자신을 친구로 등록할 수 없습니다!');
    }
  }
}
