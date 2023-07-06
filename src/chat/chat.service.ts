import { Injectable } from '@nestjs/common';
import { CreateChatRoomDto } from './dto/create-chat-room.dto';
import { UpdateChatRoomDto } from './dto/update-chat-room.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRoom } from 'src/database/entities/chatroom.entity';
import { Repository } from 'typeorm';
import { User } from 'src/database/entities/user.entity';
import { ChatUser } from 'src/database/entities/chatuser.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(ChatUser)
    private chatUserRepository: Repository<ChatUser>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getChatRoomList(userName: string) {
    if (userName == '') {
      throw new Error('Need a username for fetching chatlist');
    }
    console.log(userName);
    const targetUser = this.userRepository.findOne({ where: { userName: userName } });
    const chatUsers = this.chatUserRepository.find({ where: { userId: (await targetUser).id } });
    const chatRooms: ChatRoom[] = [];
    let element: ChatUser;
    for (let index = 0; index < (await chatUsers).length; index++) {
      console.log(`${index}, ${(await chatUsers).length}`);
      element = (await chatUsers).at(index);
      chatRooms.push(await this.chatRoomRepository.findOne({ where: { id: element.roomId } }));
    }
    return chatRooms;
  }

  async create(createChatRoomDto: CreateChatRoomDto) {
    return await this.chatRoomRepository.save(createChatRoomDto);
  }

  findAll() {
    return `This action returns all chat`;
  }

  findOne(id: number) {
    return `This action returns a #${id} chat`;
  }

  update(id: number, updateChatRoomDto: UpdateChatRoomDto) {
    return `This action updates a #${id} chat`;
  }

  remove(id: number) {
    return `This action removes a #${id} chat`;
  }
}
