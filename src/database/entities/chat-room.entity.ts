import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ChatRoomMode } from './enums';

@Entity()
export class ChatRoom extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ChatRoomMode })
  roomMode: ChatRoomMode;

  @Column({ type: 'varchar', nullable: true })
  password: string;
}
