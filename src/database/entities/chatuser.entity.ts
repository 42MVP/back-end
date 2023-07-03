import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ChatRoom } from './chat-room.entity';
import { User } from './user.entity';
import { ChatRole, ChatUserStatus } from './enums';

@Entity()
export class ChatUser extends BaseEntity {
  @PrimaryColumn()
  roomId: number;

  @PrimaryColumn()
  userId: number;

  @ManyToOne(() => ChatRoom, (chat: ChatRoom) => chat.id)
  @JoinColumn({ name: 'roomId' })
  public readonly chat: ChatRoom;

  @ManyToOne(() => User, (user: User) => user.id)
  @JoinColumn({ name: 'userId' })
  public readonly user: User;

  @Column({ type: 'enum', enum: ChatUserStatus })
  status: ChatUserStatus;

  @Column({ type: 'enum', enum: ChatRole })
  role: ChatRole;

  @Column({ type: Date })
  muteTime: Date;
}
