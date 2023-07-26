import { ChatUser } from '../database/entities/chatuser.entity';

export interface ChatRoomData {
  isChannel: boolean;
  name: string;
  hasPassword: boolean;
  users: ChatUser[];
  banUsers: ChatUser[];
  abong: ChatUser[];
}

export interface ChannelSearchResult {
  id: number;
  name: string;
  hasPassword: boolean;
}
