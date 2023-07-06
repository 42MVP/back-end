import { ChatUser } from 'src/database/entities/chatuser.entity';

export interface ChatRoomData {
  isChannel: boolean;
  name: string;
  haspassword: boolean;
  users: ChatUser[];
  banUsers: ChatUser[];
  abong: ChatUser[];
}
