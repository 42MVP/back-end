import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRoom } from '../database/entities/chatroom.entity';
import { ChatUser } from '../database/entities/chatuser.entity';
import { User } from '../database/entities/user.entity';
import { ChatRole, ChatRoomMode, ChatUserStatus } from '../database/entities/enums';
import { ChatRoomData, ChannelSearchResult } from '../chat/chat-res.interface';
import { CreateChatUserDto } from './dto/create-chat-user.dto';
import { UpdateChatUserDto } from './dto/update-chat-user.dto';
import { UpdateChatRoomDto } from './dto/update-chat-room.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { UserSocketRepository } from 'src/repository/user-socket.repository';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(ChatUser)
    private chatUserRepository: Repository<ChatUser>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private userSocketRepository: UserSocketRepository,
    private chatGateway: ChatGateway,
  ) {}

  async getChatRoomData(targetRoom: ChatRoom): Promise<ChatRoomData> {
    const chatRoomData = {} as ChatRoomData;
    chatRoomData.isChannel = targetRoom.roomMode != 'DIRECT' ? true : false;
    chatRoomData.name = targetRoom.roomName;
    chatRoomData.hasPassword = targetRoom.password == '' ? false : true;
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
    const targetUser = await this.userRepository.findOne({ where: { userName: userName } });
    if (!targetUser) {
      throw new BadRequestException('Can not find target user');
    }
    const chatUsers = await this.chatUserRepository.find({ where: { userId: targetUser.id } });
    const chatRoomList: ChatRoomData[] = [];
    for (let index = 0; index < chatUsers.length; index++) {
      const element = chatUsers[index];
      const singleRoom: ChatRoom = await this.chatRoomRepository.findOne({ where: { id: element.roomId } });
      chatRoomList.push(await this.getChatRoomData(singleRoom));
    }
    return chatRoomList;
  }

  async enterChatRoom(newChatUser: CreateChatUserDto): Promise<ChatUser> {
    const isExistUser = await this.chatUserRepository.findOne({
      where: { roomId: newChatUser.roomId, userId: newChatUser.userId },
    });
    if (isExistUser && isExistUser.status == ChatUserStatus.BAN) {
      throw new BadRequestException('The user has been banned');
    }
    const createdUser = await this.chatUserRepository.save(newChatUser.toChatUserEntity());
    const userSocketId = this.userSocketRepository.find(createdUser.userId);
    this.chatGateway.joinChatRoom(userSocketId, createdUser.roomId);
    return createdUser;
  }

  async enterChatOwner(roomId: number, userId: number): Promise<void> {
    const newChatOwner: CreateChatUserDto = {} as CreateChatUserDto;
    newChatOwner.roomId = roomId;
    newChatOwner.userId = userId;
    newChatOwner.status = ChatUserStatus.NONE;
    newChatOwner.role = ChatRole.OWNER;
    newChatOwner.muteTime = null;
    await this.chatUserRepository.save(newChatOwner.toChatUserEntity());
    const userSocketId = this.userSocketRepository.find(userId);
    this.chatGateway.joinChatRoom(userSocketId, roomId);
    return;
  }

  async createChatRoom(newRoomInfo: CreateRoomDto): Promise<ChatRoom> {
    if (newRoomInfo.roomMode == ChatRoomMode.PROTECTED) {
      if (!newRoomInfo.password) throw new BadRequestException('Protected room need a password');
    } else {
      if (newRoomInfo.roomMode == ChatRoomMode.DIRECT) {
        if (!newRoomInfo.dmId) throw new BadRequestException('DM need a target user');
        newRoomInfo.roomName = null;
      }
      newRoomInfo.password = null;
    }
    const newRoom = await this.chatRoomRepository.save(newRoomInfo.toChatRoomEntity());
    await this.enterChatOwner(newRoom.id, newRoomInfo.userId);
    if (newRoom.roomMode == ChatRoomMode.DIRECT) {
      await this.enterChatOwner(newRoom.id, newRoomInfo.dmId);
    }
    return newRoom;
  }

  async findAllChannel() {
    const allChannel = await this.chatRoomRepository.find();
    const searchResult: ChannelSearchResult[] = [];
    for (let index = 0; index < allChannel.length; index++) {
      const element = allChannel[index];
      const singleChannel = {} as ChannelSearchResult;
      singleChannel.id = element.id;
      singleChannel.name = element.roomName;
      singleChannel.hasPassword = element.password ? true : false;
      searchResult.push(singleChannel);
    }
    return searchResult;
  }

  async isChannelDm(roomId: number) {
    const targetChannel = await this.chatRoomRepository.findOne({ where: { id: roomId } });
    return targetChannel.roomMode == ChatRoomMode.DIRECT ? true : false;
  }

  async changeChatRoomInfo(execId: number, roomId: number, updateChatRoomDto: UpdateChatRoomDto) {
    if (await this.isChannelDm(roomId)) {
      throw new BadRequestException('Can not change DM channel info');
    }
    const execUser = await this.chatUserRepository.findOne({ where: { roomId: roomId, userId: execId } });
    if (!execUser) {
      throw new NotFoundException('No Such UserId or RoomId');
    }
    if (execUser.role != ChatRole.OWNER) {
      throw new BadRequestException('Permission Denied');
    }
    const targetRoom = await this.chatRoomRepository.findOne({ where: { id: roomId } });
    updateChatRoomDto.roomName = targetRoom.roomName;
    if (updateChatRoomDto.roomMode == ChatRoomMode.PROTECTED && updateChatRoomDto.password == null) {
      throw new BadRequestException('Need a password for protected room');
    }
    if (updateChatRoomDto.roomMode != ChatRoomMode.PROTECTED) {
      updateChatRoomDto.password = null;
    }
    Object.assign(targetRoom, updateChatRoomDto);
    return await this.chatRoomRepository.save(targetRoom);
  }

  checkUserAutority(execUser: ChatUser, targetUser: ChatUser) {
    if (!execUser || !targetUser) {
      throw new NotFoundException('No Such User');
    }
    if (execUser.role == ChatRole.USER) {
      throw new BadRequestException('Permission Denied');
    }
    if (targetUser.role == ChatRole.OWNER) {
      throw new BadRequestException('Invalid Role to Change');
    }
    return;
  }

  async changeChatUserRole(execUserId: number, updateChatUserDto: UpdateChatUserDto) {
    if (await this.isChannelDm(updateChatUserDto.roomId)) {
      throw new BadRequestException('Can not change DM channel info');
    }
    const execUser = await this.chatUserRepository.findOne({
      where: { roomId: updateChatUserDto.roomId, userId: execUserId },
    });
    const targetUser = await this.chatUserRepository.findOne({
      where: { roomId: updateChatUserDto.roomId, userId: updateChatUserDto.userId },
    });
    this.checkUserAutority(execUser, targetUser);
    Object.assign(targetUser, updateChatUserDto);
    await this.chatUserRepository.save(targetUser);
    this.chatGateway.handleUserRole(updateChatUserDto.roomId.toString(), updateChatUserDto.role);
    return;
  }

  async changeChatUserStatus(execUserId: number, updateChatUserDto: UpdateChatUserDto) {
    if (await this.isChannelDm(updateChatUserDto.roomId)) {
      throw new BadRequestException('Can not change DM channel info');
    }
    const execUser = await this.chatUserRepository.findOne({
      where: { roomId: updateChatUserDto.roomId, userId: execUserId },
    });
    const targetUser = await this.chatUserRepository.findOne({
      where: { roomId: updateChatUserDto.roomId, userId: updateChatUserDto.userId },
    });
    this.checkUserAutority(execUser, targetUser);
    if (updateChatUserDto.status == ChatUserStatus.MUTE && !updateChatUserDto.muteTime) {
      throw new BadRequestException('Need limited mute time');
    }
    if (updateChatUserDto.status != ChatUserStatus.MUTE && targetUser.muteTime) {
      updateChatUserDto.muteTime = null;
    }
    Object.assign(targetUser, updateChatUserDto);
    await this.chatUserRepository.save(targetUser);
    this.chatGateway.handleUserStatus(updateChatUserDto.roomId.toString(), updateChatUserDto.status);
    return;
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
