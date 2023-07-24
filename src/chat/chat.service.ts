import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRoom } from '../database/entities/chatroom.entity';
import { ChatUser } from '../database/entities/chatuser.entity';
import { User } from '../database/entities/user.entity';
import { ChatRole, ChatRoomMode, ChatUserStatus } from '../database/entities/enums';
import { ChatRoomData, ChannelSearchResult } from '../chat/chat-res.interface';
import { CreateChatUserDto } from './dto/request/create-chat-user.dto';
import { UpdateChatUserDto } from './dto/request/update-chat-user.dto';
import { UpdateChatRoomDto } from './dto/request/update-chat-room.dto';
import { CreateChatRoomDto } from './dto/request/create-chat-room.dto';
import { UserSocketRepository } from '../repository/user-socket.repository';
import { ChatGateway } from './chat.gateway';
import { ChangedUserRoleDto } from './dto/response/changed-user-role.dto';
import { ChangedUserStatusDto } from './dto/response/changed-user-status.dto';
import { ExitChatRoomDto } from './dto/request/exit-chat-room.dto';

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
    // TODO: 아바타 정보도 추가하기
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
    // TODO: ChatRoomList에서 사용하는 데이터 타입을 DTO로 변경하기
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
    // TODO: Protected 일때 비밀번호 검증하는 로직 추가
    const isExistUser = await this.chatUserRepository.findOne({
      where: { roomId: newChatUser.roomId, userId: newChatUser.userId },
    });
    if (isExistUser && isExistUser.status == ChatUserStatus.BAN) {
      throw new BadRequestException('The user has been banned');
    }
    const createdUser = await this.chatUserRepository.save(newChatUser.toChatUserEntity());
    const userSocketId = this.userSocketRepository.find(createdUser.userId);
    const userName = (await this.userRepository.findOne({ where: { id: createdUser.userId } })).userName;
    this.chatGateway.joinChatRoom(userSocketId, userName, createdUser.roomId);
    return createdUser;
  }

  async enterChatOwner(roomId: number, userId: number): Promise<void> {
    const newChatOwner: CreateChatUserDto = new CreateChatUserDto();
    newChatOwner.roomId = roomId;
    newChatOwner.userId = userId;
    newChatOwner.status = ChatUserStatus.NONE;
    newChatOwner.role = ChatRole.OWNER;
    newChatOwner.muteTime = null;
    const createdOwner = await this.chatUserRepository.save(newChatOwner.toChatUserEntity());
    const userSocketId = this.userSocketRepository.find(userId);
    const ownerName = (await this.userRepository.findOne({ where: { id: createdOwner.userId } })).userName;
    this.chatGateway.joinChatRoom(userSocketId, ownerName, roomId);
    return;
  }

  async createChatRoom(newRoomInfo: CreateChatRoomDto): Promise<ChatRoom> {
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
    // TODO: FindAllChannel에서 사용하는 데이터 타입을 DTO로 변경하기
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

  async changeChatRoomInfo(changeInfo: UpdateChatRoomDto) {
    if (await this.isChannelDm(changeInfo.roomId)) {
      throw new BadRequestException('Can not change DM channel info');
    }
    const execUser = await this.chatUserRepository.findOne({
      where: { roomId: changeInfo.roomId, userId: changeInfo.execUserId },
    });
    if (!execUser) {
      throw new NotFoundException('No Such UserId or RoomId');
    }
    if (execUser.role != ChatRole.OWNER) {
      throw new BadRequestException('Permission Denied');
    }
    const targetRoom = await this.chatRoomRepository.findOne({ where: { id: changeInfo.roomId } });
    changeInfo.roomName = targetRoom.roomName;
    if (changeInfo.roomMode == ChatRoomMode.PROTECTED && changeInfo.password == null) {
      throw new BadRequestException('Need a password for protected room');
    }
    if (changeInfo.roomMode != ChatRoomMode.PROTECTED) {
      changeInfo.password = null;
    }
    Object.assign(targetRoom, changeInfo.toChatRoomEntity());
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

  async changeChatUserRole(changeChatUserInfo: UpdateChatUserDto) {
    if (await this.isChannelDm(changeChatUserInfo.roomId)) {
      throw new BadRequestException('Can not change DM channel info');
    }
    const execUser = await this.chatUserRepository.findOne({
      where: { roomId: changeChatUserInfo.roomId, userId: changeChatUserInfo.execUserId },
    });
    const targetUser = await this.chatUserRepository.findOne({
      where: { roomId: changeChatUserInfo.roomId, userId: changeChatUserInfo.userId },
    });
    this.checkUserAutority(execUser, targetUser);
    // TODO: save 대신 update 사용을 고려해보기 (where?)
    Object.assign(targetUser, changeChatUserInfo.toChatUserEntity());
    await this.chatUserRepository.save(targetUser);
    const changedRole: ChangedUserRoleDto = new ChangedUserRoleDto();
    changedRole.userName = (await this.userRepository.findOne({ where: { id: targetUser.userId } })).userName;
    changedRole.changedRole = targetUser.role;
    this.chatGateway.sendChangedUserRole(changedRole, targetUser.roomId);
    return;
  }

  async changeChatUserStatus(changeChatUserInfo: UpdateChatUserDto) {
    // TODO: kick, ban 경우 변경하고 내보내기
    if (await this.isChannelDm(changeChatUserInfo.roomId)) {
      throw new BadRequestException('Can not change DM channel info');
    }
    const execUser = await this.chatUserRepository.findOne({
      where: { roomId: changeChatUserInfo.roomId, userId: changeChatUserInfo.execUserId },
    });
    const targetUser = await this.chatUserRepository.findOne({
      where: { roomId: changeChatUserInfo.roomId, userId: changeChatUserInfo.userId },
    });
    this.checkUserAutority(execUser, targetUser);
    if (changeChatUserInfo.status == ChatUserStatus.MUTE && !changeChatUserInfo.muteTime) {
      throw new BadRequestException('Need limited mute time');
    }
    if (changeChatUserInfo.status != ChatUserStatus.MUTE && targetUser.muteTime) {
      changeChatUserInfo.muteTime = null;
    }
    Object.assign(targetUser, changeChatUserInfo);
    await this.chatUserRepository.save(targetUser);
    const changedStatus: ChangedUserStatusDto = new ChangedUserStatusDto();
    changedStatus.userName = (await this.userRepository.findOne({ where: { id: targetUser.userId } })).userName;
    changedStatus.status = targetUser.status;
    this.chatGateway.sendChangedUserStatus(changedStatus, targetUser.roomId);
    return;
  }

  async exitChatRoom(exitInfo: ExitChatRoomDto) {
    const exitUser = await this.chatUserRepository.findOne({
      where: { roomId: exitInfo.roomId, userId: exitInfo.userId },
    });
    const userSocketId = this.userSocketRepository.find(exitInfo.userId);
    const userName = (await this.userRepository.findOne({ where: { id: exitUser.userId } })).userName;
    this.chatGateway.exitChatRoom(userSocketId, userName, exitInfo.roomId);
    if (exitUser.role != ChatRole.OWNER) {
      return await this.chatUserRepository.remove(exitUser);
    } else {
      const exitRoom = await this.chatRoomRepository.findOne({ where: { id: exitInfo.roomId } });
      const chatUsers = await this.chatUserRepository.find({ where: { roomId: exitInfo.roomId } });
      await this.chatUserRepository.remove(chatUsers);
      return await this.chatRoomRepository.remove(exitRoom);
    }
  }
}
