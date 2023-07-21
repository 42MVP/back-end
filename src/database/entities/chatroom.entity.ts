import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ChatRoomMode } from './enums';

@Entity()
export class ChatRoom extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  roomName: string;

  @Column({ type: 'enum', enum: ChatRoomMode })
  roomMode: ChatRoomMode;

  @Column({ type: 'varchar', nullable: true })
  password: string;

  static from(roomName: string, roomMode: ChatRoomMode, password: string) {
    const chatRoom: ChatRoom = new ChatRoom();
    chatRoom.roomName = roomName;
    chatRoom.roomMode = roomMode;
    chatRoom.password = password;
    return chatRoom;
  }
}
