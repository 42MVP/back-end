import { Injectable } from '@nestjs/common';
import { CreateChatRoomDto } from './dto/create-chat-room.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRoom } from '../database/entities/chatroom.entity';
import { ChatUser } from '../database/entities/chatuser.entity';
import { User } from '../database/entities/user.entity';
import { ChatRole, ChatUserStatus } from '../database/entities/enums';
import { ChatRoomData } from '../chat/chat-res.interface';
import { CreateChatUserDto } from './dto/create-chat-user.dto';
import { UpdateChatUserDto } from './dto/update-chat-user.dto';

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

  async getChatRoomData(targetRoom: ChatRoom): Promise<ChatRoomData> {
    const chatRoomData = {} as ChatRoomData;
    chatRoomData.isChannel = targetRoom.roomMode != 'DIRECT' ? true : false;
    chatRoomData.name = targetRoom.roomName;
    chatRoomData.haspassword = targetRoom.password == '' ? false : true;
    chatRoomData.users = await this.chatUserRepository.find({
      where: { roomId: targetRoom.id, status: ChatUserStatus.NONE },
    });
    chatRoomData.banUsers = await this.chatUserRepository.find({
      where: { roomId: targetRoom.id, status: ChatUserStatus.BAN },
    });
    chatRoomData.abong = await this.chatUserRepository.find({
      where: { roomId: targetRoom.id, status: ChatUserStatus.MUTE },
    });
    return chatRoomData;
  }

  async getChatRoomList(userName: string): Promise<ChatRoomData[]> {
    if (userName == '') {
      throw new Error('Need a username for fetching chatlist');
    }
    const targetUser = this.userRepository.findOne({ where: { userName: userName } });
    const chatUsers = this.chatUserRepository.find({ where: { userId: (await targetUser).id } });
    let element: ChatUser;
    let singleRoom: ChatRoom;
    const chatRoomList: ChatRoomData[] = [];
    for (let index = 0; index < (await chatUsers).length; index++) {
      element = (await chatUsers).at(index);
      singleRoom = await this.chatRoomRepository.findOne({ where: { id: element.roomId } });
      chatRoomList.push(await this.getChatRoomData(singleRoom));
    }
    return chatRoomList;
  }

  async enterChatRoom(createChatUserDto: CreateChatUserDto) {
    return await this.chatUserRepository.save(createChatUserDto);
  }

  async createChatRoom(userId: number, createChatRoomDto: CreateChatRoomDto) {
    const newRoom = await this.chatRoomRepository.save(createChatRoomDto);
    console.log(newRoom);
    const newChatUser: CreateChatUserDto = {} as CreateChatUserDto;
    newChatUser.roomId = newRoom.id;
    newChatUser.userId = userId;
    newChatUser.status = ChatUserStatus.NONE;
    newChatUser.role = ChatRole.OWNER;
    newChatUser.muteTime = null;
    return await this.enterChatRoom(newChatUser);
  }

  findAll() {
    return `This action returns all chat`;
  }

  findOne(id: number) {
    return `This action returns a #${id} chat`;
  }

  async changeChatUserRole(userId: number, roomId: number, updateChatUserDto: UpdateChatUserDto) {
    const newAdmin = await this.chatUserRepository.findOne({ where: { userId: userId, roomId: roomId } });
    if (!newAdmin) {
      throw new Error('No Such User');
    }
    if (newAdmin.status == ChatUserStatus.BAN || newAdmin.status == ChatUserStatus.KICK) {
      throw new Error('Invalid User');
    }
    if (updateChatUserDto.role == ChatRole.OWNER) {
      throw new Error('Invalid Role');
    }
    Object.assign(newAdmin, updateChatUserDto);
    return await this.chatUserRepository.save(newAdmin);
  }

  async exitChatRoom(userId: number, roomId: number) {
    const exitUser = await this.chatUserRepository.findOne({ where: { roomId: roomId, userId: userId } });
    if (exitUser.role != ChatRole.OWNER) {
      return await this.chatUserRepository.remove(exitUser);
    } else {
      const exitRoom = await this.chatRoomRepository.findOne({ where: { id: roomId } });
      const chatUsers = await this.chatUserRepository.find({ where: { roomId: roomId } });
      await this.chatUserRepository.remove(chatUsers);
      return await this.chatRoomRepository.remove(exitRoom);
    }
  }
}
