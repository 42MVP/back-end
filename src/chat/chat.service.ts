import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRoom } from '../common/entities/chatroom.entity';
import { ChatUser } from '../common/entities/chatuser.entity';
import { User } from '../common/entities/user.entity';
import { ChatRole, ChatRoomMode, ChatUserStatus } from '../common/enums';
import { UserSocketRepository } from '../repository/user-socket.repository';
import { MuteTimeRepository } from '../repository/mute-time.repository';
import { ChatGateway } from './chat.gateway';
import { newChatRoomDto } from './dto/request/new-chat-room.dto';
import { EnterChatRoomDto } from './dto/request/enter-chat-room.dto';
import { ChangeChatRoomDto } from './dto/request/change-chat-room.dto';
import { FindChatUserDto } from './dto/request/find-chat-user.dto';
import { UpdateChatStatusDto } from './dto/request/update-chat-status.dto';
import { UpdateChatRoleDto } from './dto/request/update-chat-role.dto';
import { ChatRoomDataDto } from './dto/response/chat-room-data.dto';
import { ChatUserDto } from './dto/response/chat-user.dto';
import { ChatRoomDto } from './dto/response/chat-room.dto';
import { ChangedUserRoleDto } from './dto/response/changed-user-role.dto';
import { ChangedUserStatusDto } from './dto/response/changed-user-status.dto';

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

  private defaultMuteTime: Date = new Date('1970-01-01T00:00:00.000Z');

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

  async enterChatRoom(userId: number, chatRoom: EnterChatRoomDto): Promise<ChatRoomDataDto> {
    const targetRoom = await this.chatRoomRepository.findOne({ where: { id: chatRoom.roomId } });
    if (targetRoom.roomMode === ChatRoomMode.PROTECTED && targetRoom.password !== chatRoom.password) {
      throw new BadRequestException('Wrong Password');
    }
    const isExistUser = await this.chatUserRepository.findOne({
      where: { roomId: chatRoom.roomId, userId: userId },
    });
    if (isExistUser && isExistUser.status === ChatUserStatus.BAN) {
      throw new BadRequestException('The user has been banned');
    }
    if (!isExistUser) {
      const newChatUser: ChatUser = ChatUser.from(chatRoom.roomId, userId, ChatUserStatus.NONE, ChatRole.USER, null);
      await this.chatUserRepository.save(newChatUser);
    }
    const userSocketId = this.userSocketRepository.find(userId);
    if (typeof userSocketId === 'string') {
      const userName = (await this.userRepository.findOne({ where: { id: userId } })).userName;
      this.chatGateway.joinChatRoom(userSocketId, userName, chatRoom.roomId);
    }
    return this.getChatRoomDto(targetRoom);
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

  async createDMRoom(userId: number, newRoomInfo: newChatRoomDto): Promise<ChatRoomDto> {
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
    return new ChatRoomDto(newRoom.id, newRoom.roomName, newRoom.roomMode);
  }

  async createChatRoom(userId: number, newRoomInfo: newChatRoomDto): Promise<ChatRoomDto> {
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
    return new ChatRoomDto(newRoom.id, newRoom.roomName, newRoom.roomMode);
  }

  async inviteChatUser(userId: number, invitedChatUser: FindChatUserDto) {
    return;
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
    const searchResult: ChatRoomDto[] = await Promise.all(
      freshChannel.map((x: ChatRoom) => new ChatRoomDto(x.id, x.roomName, x.roomMode)),
    );
    return searchResult;
  }

  async isChannelDm(roomId: number) {
    const targetChannel = await this.chatRoomRepository.findOne({ where: { id: roomId } });
    return targetChannel.roomMode === ChatRoomMode.DIRECT ? true : false;
  }

  async changeChatRoomInfo(userId: number, changeRoomInfo: ChangeChatRoomDto) {
    const targetRoom = await this.chatRoomRepository.findOne({ where: { id: changeRoomInfo.roomId } });
    if (!targetRoom) throw new NotFoundException('No such Chat room');
    if (await this.isChannelDm(changeRoomInfo.roomId)) {
      throw new BadRequestException('Can not change DM channel info');
    }
    const execUser = await this.chatUserRepository.findOne({
      where: { roomId: changeRoomInfo.roomId, userId: userId },
    });
    if (!execUser) {
      throw new NotFoundException('No Such UserId or RoomId');
    }
    if (execUser.role !== ChatRole.OWNER) {
      throw new BadRequestException('Permission Denied');
    }
    if (changeRoomInfo.roomMode === ChatRoomMode.PROTECTED) {
      console.log(typeof changeRoomInfo.password);
      if (typeof changeRoomInfo.password !== 'string')
        throw new BadRequestException('Need a password for protected room');
    }
    if (changeRoomInfo.roomMode !== ChatRoomMode.PROTECTED) {
      changeRoomInfo.password = null;
    }
    if (changeRoomInfo.roomMode) targetRoom.roomMode = changeRoomInfo.roomMode;
    if (changeRoomInfo.password) targetRoom.password = changeRoomInfo.password;
    await this.chatRoomRepository.save(targetRoom);
    return;
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

  async changeChatUserRole(userId: number, newChatRole: UpdateChatRoleDto) {
    const execUser = await this.chatUserRepository.findOne({
      where: { roomId: newChatRole.roomId, userId: userId },
    });
    const targetUser = await this.chatUserRepository.findOne({
      where: { roomId: newChatRole.roomId, userId: newChatRole.userId },
    });
    this.checkUserAutority(execUser, targetUser);
    if (await this.isChannelDm(newChatRole.roomId)) {
      throw new BadRequestException('Can not change DM channel info');
    }
    targetUser.role = newChatRole.role;
    await this.chatUserRepository.save(targetUser);
    const changedRole: ChangedUserRoleDto = new ChangedUserRoleDto();
    changedRole.userName = (await this.userRepository.findOne({ where: { id: targetUser.userId } })).userName;
    changedRole.changedRole = targetUser.role;
    this.chatGateway.sendChangedUserRole(changedRole, targetUser.roomId);
    return;
  }

  updateMuteTime(newChatStatus: UpdateChatStatusDto, targetUser: ChatUser) {
    if (newChatStatus.status == ChatUserStatus.MUTE) {
      if (!newChatStatus.muteTime || typeof newChatStatus.muteTime === 'undefined')
        throw new BadRequestException('Need limited mute time');
      targetUser.muteTime = newChatStatus.muteTime;
      this.muteTimeRepository.save(targetUser.userId, targetUser.muteTime);
    } else {
      // console.log(`${this.defaultMuteTime}`);
      targetUser.muteTime = this.defaultMuteTime;
      this.muteTimeRepository.delete(targetUser.userId);
    }
  }

  async changeChatUserStatus(userId: number, newChatStatus: UpdateChatStatusDto) {
    const execUser = await this.chatUserRepository.findOne({
      where: { roomId: newChatStatus.roomId, userId: userId },
    });
    const targetUser = await this.chatUserRepository.findOne({
      where: { roomId: newChatStatus.roomId, userId: newChatStatus.userId },
    });
    this.checkUserAutority(execUser, targetUser);
    if (await this.isChannelDm(newChatStatus.roomId)) {
      throw new BadRequestException('Can not change DM channel info');
    }
    targetUser.status = newChatStatus.status;
    this.updateMuteTime(newChatStatus, targetUser);
    if (targetUser.status === ChatUserStatus.KICK) {
      await this.chatUserRepository.remove(targetUser);
    } else {
      Object.assign(targetUser, targetUser);
      await this.chatUserRepository.save(targetUser);
    }
    const changedStatus: ChangedUserStatusDto = new ChangedUserStatusDto();
    changedStatus.userName = (await this.userRepository.findOne({ where: { id: targetUser.userId } })).userName;
    changedStatus.status = targetUser.status;
    const userSocket = this.userSocketRepository.find(targetUser.userId);
    if (typeof userSocket === 'string')
      this.chatGateway.sendChangedUserStatus(userSocket, changedStatus, newChatStatus.roomId);
    return;
  }

  async leaveChatRoom(chatUser: ChatUser) {
    const userSocketId = this.userSocketRepository.find(chatUser.userId);
    if (typeof userSocketId === 'string') {
      const userName = (await this.userRepository.findOne({ where: { id: chatUser.userId } })).userName;
      this.chatGateway.exitChatRoom(userSocketId, userName, chatUser.roomId);
    }
    await this.chatUserRepository.remove(chatUser);
  }

  async destroyChatRoom(targetRoom: ChatRoom) {
    const chatUsers: ChatUser[] = await this.chatUserRepository.find({ where: { roomId: targetRoom.id } });
    chatUsers.map(async (x: ChatUser) => await this.leaveChatRoom(x));
    await this.chatRoomRepository.remove(targetRoom);
  }

  async exitChatRoom(userId: number, roomId: number) {
    const targetRoom: ChatRoom = await this.chatRoomRepository.findOne({ where: { id: roomId } });
    if (!targetRoom) throw new NotFoundException('can not exit from non existing room');
    const exitUser = await this.chatUserRepository.findOne({
      where: { roomId: roomId, userId: userId },
    });
    if (!exitUser) throw new NotFoundException('Can not find target user');
    if (exitUser.role !== ChatRole.OWNER) {
      await this.leaveChatRoom(exitUser);
    } else {
      await this.destroyChatRoom(targetRoom);
    }
  }
}
