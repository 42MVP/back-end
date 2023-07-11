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

  async findAllChannel() {
    return await this.chatRoomRepository.find();
  }

  checkUserAutority(execUser: ChatUser, targetUser: ChatUser) {
    if (!execUser || !targetUser) {
      throw new Error('No Such User');
    }
    if (execUser.role == ChatRole.USER) {
      throw new Error('Permission Denied');
    }
    if (targetUser.role == ChatRole.OWNER) {
      throw new Error('Invalid Role to Change');
    }
    return;
  }

  async changeChatUserRole(execUserId: number, updateChatUserDto: UpdateChatUserDto) {
    const execUser = await this.chatUserRepository.findOne({
      where: { roomId: updateChatUserDto.roomId, userId: execUserId },
    });
    const targetUser = await this.chatUserRepository.findOne({
      where: { roomId: updateChatUserDto.roomId, userId: updateChatUserDto.userId },
    });
    this.checkUserAutority(execUser, targetUser);
    Object.assign(targetUser, updateChatUserDto);
    return await this.chatUserRepository.save(targetUser);
  }

  async changeChatUserStatus(execUserId: number, updateChatUserDto: UpdateChatUserDto) {
    const execUser = await this.chatUserRepository.findOne({
      where: { roomId: updateChatUserDto.roomId, userId: execUserId },
    });
    const targetUser = await this.chatUserRepository.findOne({
      where: { roomId: updateChatUserDto.roomId, userId: updateChatUserDto.userId },
    });
    this.checkUserAutority(execUser, targetUser);
    if (updateChatUserDto.status == ChatUserStatus.MUTE && !updateChatUserDto.muteTime) {
      throw new Error('Need limited mute time');
    }
    if (updateChatUserDto.status != ChatUserStatus.MUTE && targetUser.muteTime) {
      updateChatUserDto.muteTime = null;
    }
    Object.assign(targetUser, updateChatUserDto);
    return await this.chatUserRepository.save(targetUser);
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
