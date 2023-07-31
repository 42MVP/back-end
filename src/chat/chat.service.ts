import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRoom } from '../common/entities/chatroom.entity';
import { ChatUser } from '../common/entities/chatuser.entity';
import { User } from '../common/entities/user.entity';
import { ChatRole, ChatRoomMode, ChatUserStatus } from '../common/enums';
import { CreateChatUserDto } from './dto/request/create-chat-user.dto';
import { UpdateChatUserDto } from './dto/request/update-chat-user.dto';
import { UpdateChatRoomDto } from './dto/request/update-chat-room.dto';
import { newChatRoomDto } from './dto/request/new-chat-room.dto';
import { UserSocketRepository } from '../repository/user-socket.repository';
import { ChatGateway } from './chat.gateway';
import { ChangedUserRoleDto } from './dto/response/changed-user-role.dto';
import { ChangedUserStatusDto } from './dto/response/changed-user-status.dto';
import { ExitChatRoomDto } from './dto/request/exit-chat-room.dto';
import { ChatRoomDataDto } from './dto/response/chat-room-data.dto';
import { ChatUserDto } from './dto/response/chat-user.dto';
import { ChatSearchResultDto } from './dto/response/chat-search-result.dto';
import { MuteTimeRepository } from '../repository/mute-time.repository';
import { CreatedChatRoomDto } from './dto/response/created-chat-room.dto';

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
    private muteTimeRepository: MuteTimeRepository,
    private chatGateway: ChatGateway,
  ) {}

  async getChatUserDto(chatUser: ChatUser): Promise<ChatUserDto> {
    const user: User = await this.userRepository.findOne({ where: { id: chatUser.userId } });
    return new ChatUserDto(user.id, user.userName, '', chatUser.role, chatUser.muteTime);
  }

  async getChatUserList(roomId: number, commonStatus: ChatUserStatus): Promise<ChatUserDto[]> {
    const chatUsersWithCommonStatus: ChatUser[] = await this.chatUserRepository.find({
      where: { roomId: roomId, status: commonStatus },
    });
    const chatUserList: ChatUserDto[] = await Promise.all(
      chatUsersWithCommonStatus.map((chatUser: ChatUser) => this.getChatUserDto(chatUser)),
    );
    return chatUserList;
  }

  async getChatRoomDto(targetRoom: ChatRoom): Promise<ChatRoomDataDto> {
    const chatRoomData = new ChatRoomDataDto(
      targetRoom.id,
      targetRoom.roomName,
      targetRoom.roomMode,
      await this.getChatUserList(targetRoom.id, ChatUserStatus.NONE),
      await this.getChatUserList(targetRoom.id, ChatUserStatus.BAN),
      await this.getChatUserList(targetRoom.id, ChatUserStatus.MUTE),
    );
    return chatRoomData;
  }

  async getChatRoomList(userId: number, userName: string): Promise<ChatRoomDataDto[]> {
    const targetUser = await this.userRepository.findOne({ where: { id: userId } });
    if (!targetUser) {
      throw new BadRequestException('Can not find target user');
    }
    if (targetUser.userName !== userName) {
      throw new BadRequestException('user name does not match to target user');
    }
    const userChatProfiles = await this.chatUserRepository.find({ where: { userId: targetUser.id } });
    const userChatRooms: ChatRoom[] = await Promise.all(
      userChatProfiles.map(
        async (chatUser: ChatUser) => await this.chatRoomRepository.findOne({ where: { id: chatUser.roomId } }),
      ),
    );
    const chatRoomList: ChatRoomDataDto[] = await Promise.all(
      userChatRooms.map(async (chatRoom: ChatRoom) => await this.getChatRoomDto(chatRoom)),
    );
    return chatRoomList;
  }

  async enterChatRoom(userId: number, newChatUser: CreateChatUserDto): Promise<ChatUser> {
    const isExistUser = await this.chatUserRepository.findOne({
      where: { roomId: newChatUser.roomId, userId: newChatUser.userId },
    });
    if (isExistUser && isExistUser.status === ChatUserStatus.BAN) {
      throw new BadRequestException('The user has been banned');
    }
    const targetRoom = await this.chatRoomRepository.findOne({ where: { id: newChatUser.roomId } });
    if (targetRoom.roomMode === ChatRoomMode.PROTECTED && targetRoom.password !== newChatUser.roomPassword) {
      throw new BadRequestException('Wrong Password');
    }
    const createdUser = await this.chatUserRepository.save(newChatUser.toChatUserEntity());
    const userSocketId = this.userSocketRepository.find(createdUser.userId);
    const userName = (await this.userRepository.findOne({ where: { id: createdUser.userId } })).userName;
    this.chatGateway.joinChatRoom(userSocketId, userName, createdUser.roomId);
    return createdUser;
  }

  async enterChatOwner(roomId: number, userId: number): Promise<void> {
    const newChatOwner: ChatUser = ChatUser.from(roomId, userId, ChatUserStatus.NONE, ChatRole.OWNER, null);
    const createdOwner = await this.chatUserRepository.save(newChatOwner);
    const userSocketId = this.userSocketRepository.find(userId);
    if (typeof userSocketId === 'string') {
      const ownerName = (await this.userRepository.findOne({ where: { id: createdOwner.userId } })).userName;
      this.chatGateway.joinChatRoom(userSocketId, ownerName, roomId);
    }
    return;
  }

  async createDMRoom(userId: number, newRoomInfo: newChatRoomDto): Promise<CreatedChatRoomDto> {
    const targetUser: User = await this.userRepository.findOne({ where: { id: userId } });
    if (!targetUser) throw new BadRequestException('Can not find target user');
    if (!newRoomInfo.dmId) throw new BadRequestException('DM need a target user');
    const dmUser: User = await this.userRepository.findOne({ where: { id: newRoomInfo.dmId } });
    if (!dmUser) throw new BadRequestException('Can not find target user');
    newRoomInfo.roomName = null;
    newRoomInfo.password = null;
    const newRoom = await this.chatRoomRepository.save(newRoomInfo.toChatRoomEntity());
    await this.enterChatOwner(newRoom.id, userId);
    await this.enterChatOwner(newRoom.id, newRoomInfo.dmId);
    return new CreatedChatRoomDto(newRoom.id, newRoom.roomName, newRoom.roomMode);
  }

  async createChatRoom(userId: number, newRoomInfo: newChatRoomDto): Promise<CreatedChatRoomDto> {
    if (newRoomInfo.roomMode === ChatRoomMode.DIRECT) return this.createDMRoom(userId, newRoomInfo);
    const targetUser: User = await this.userRepository.findOne({ where: { id: userId } });
    if (!targetUser) throw new BadRequestException('Can not find target user');
    if (newRoomInfo.roomMode === ChatRoomMode.PROTECTED) {
      if (!newRoomInfo.password) throw new BadRequestException('Protected room need a password');
    } else {
      newRoomInfo.password = null;
    }
    const newRoom = await this.chatRoomRepository.save(newRoomInfo.toChatRoomEntity());
    await this.enterChatOwner(newRoom.id, userId);
    return new CreatedChatRoomDto(newRoom.id, newRoom.roomName, newRoom.roomMode);
  }

  async findFreshChannels(userId: number) {
    const targetUser: User = await this.userRepository.findOne({ where: { id: userId } });
    if (!targetUser) throw new BadRequestException('Can not find target user');
    const allChannel: ChatRoom[] = await this.chatRoomRepository.find({
      where: [{ roomMode: ChatRoomMode.PUBLIC }, { roomMode: ChatRoomMode.PROTECTED }],
    });
    const userChatProfiles = await this.chatUserRepository.find({ where: { userId: userId } });
    const userChatRooms: ChatRoom[] = await Promise.all(
      userChatProfiles.map(
        async (chatUser: ChatUser) => await this.chatRoomRepository.findOne({ where: { id: chatUser.roomId } }),
      ),
    );
    const freshChannel: ChatRoom[] = allChannel.filter(
      (x: ChatRoom) => !userChatRooms.map((y: ChatRoom) => y.id).includes(x.id),
    );
    const searchResult: CreatedChatRoomDto[] = await Promise.all(
      freshChannel.map((x: ChatRoom) => new CreatedChatRoomDto(x.id, x.roomName, x.roomMode)),
    );
    return searchResult;
  }

  async isChannelDm(roomId: number) {
    const targetChannel = await this.chatRoomRepository.findOne({ where: { id: roomId } });
    return targetChannel.roomMode === ChatRoomMode.DIRECT ? true : false;
  }

  async changeChatRoomInfo(userId: number, changeInfo: UpdateChatRoomDto) {
    if (await this.isChannelDm(changeInfo.roomId)) {
      throw new BadRequestException('Can not change DM channel info');
    }
    const execUser = await this.chatUserRepository.findOne({
      where: { roomId: changeInfo.roomId, userId: changeInfo.execUserId },
    });
    if (!execUser) {
      throw new NotFoundException('No Such UserId or RoomId');
    }
    if (execUser.role !== ChatRole.OWNER) {
      throw new BadRequestException('Permission Denied');
    }
    const targetRoom = await this.chatRoomRepository.findOne({ where: { id: changeInfo.roomId } });
    // changeInfo.roomName = targetRoom.roomName;
    // if (changeInfo.roomMode === ChatRoomMode.PROTECTED && changeInfo.password === null) {
    //   throw new BadRequestException('Need a password for protected room');
    // }
    // if (changeInfo.roomMode !== ChatRoomMode.PROTECTED) {
    //   changeInfo.password = null;
    // }
    // Object.assign(targetRoom, changeInfo.toChatRoomEntity());
    return await this.chatRoomRepository.save(targetRoom);
  }

  checkUserAutority(execUser: ChatUser, targetUser: ChatUser) {
    if (!execUser || !targetUser) {
      throw new NotFoundException('No Such User');
    }
    if (execUser.role === ChatRole.USER) {
      throw new BadRequestException('Permission Denied');
    }
    if (targetUser.role === ChatRole.OWNER) {
      throw new BadRequestException('Invalid Role to Change');
    }
    return;
  }

  async changeChatUserRole(userId: number, changeChatUserInfo: UpdateChatUserDto) {
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
    Object.assign(targetUser, changeChatUserInfo.toChatUserEntity());
    await this.chatUserRepository.save(targetUser);
    const changedRole: ChangedUserRoleDto = new ChangedUserRoleDto();
    changedRole.userName = (await this.userRepository.findOne({ where: { id: targetUser.userId } })).userName;
    changedRole.changedRole = targetUser.role;
    this.chatGateway.sendChangedUserRole(changedRole, targetUser.roomId);
    return;
  }

  async changeChatUserStatus(userId: number, changedUserInfo: UpdateChatUserDto) {
    if (await this.isChannelDm(changedUserInfo.roomId)) {
      throw new BadRequestException('Can not change DM channel info');
    }
    const execUser = await this.chatUserRepository.findOne({
      where: { roomId: changedUserInfo.roomId, userId: changedUserInfo.execUserId },
    });
    const targetUser = await this.chatUserRepository.findOne({
      where: { roomId: changedUserInfo.roomId, userId: changedUserInfo.userId },
    });
    this.checkUserAutority(execUser, targetUser);
    if (changedUserInfo.status === ChatUserStatus.MUTE) {
      if (!changedUserInfo.muteTime) throw new BadRequestException('Need limited mute time');
      this.muteTimeRepository.save(changedUserInfo.userId, changedUserInfo.muteTime);
    }
    if (changedUserInfo.status !== ChatUserStatus.MUTE && targetUser.muteTime) {
      changedUserInfo.muteTime = null;
    }
    const changedStatus: ChangedUserStatusDto = new ChangedUserStatusDto();
    changedStatus.userName = (await this.userRepository.findOne({ where: { id: targetUser.userId } })).userName;
    changedStatus.status = changedUserInfo.status;
    const userSocket = this.userSocketRepository.find(changedUserInfo.userId);
    if (changedUserInfo.status === ChatUserStatus.KICK) {
      await this.chatUserRepository.remove(targetUser);
    } else {
      Object.assign(targetUser, changedUserInfo);
      await this.chatUserRepository.save(targetUser);
    }
    this.chatGateway.sendChangedUserStatus(userSocket, changedStatus, changedUserInfo.roomId);
    return;
  }

  async exitChatRoom(userId: number, exitInfo: ExitChatRoomDto) {
    const exitUser = await this.chatUserRepository.findOne({
      where: { roomId: exitInfo.roomId, userId: exitInfo.userId },
    });
    const userSocketId = this.userSocketRepository.find(exitInfo.userId);
    const userName = (await this.userRepository.findOne({ where: { id: exitUser.userId } })).userName;
    this.chatGateway.exitChatRoom(userSocketId, userName, exitInfo.roomId);
    if (exitUser.role !== ChatRole.OWNER) {
      return await this.chatUserRepository.remove(exitUser);
    } else {
      const exitRoom = await this.chatRoomRepository.findOne({ where: { id: exitInfo.roomId } });
      const chatUsers = await this.chatUserRepository.find({ where: { roomId: exitInfo.roomId } });
      await this.chatUserRepository.remove(chatUsers);
      return await this.chatRoomRepository.remove(exitRoom);
    }
  }
}
