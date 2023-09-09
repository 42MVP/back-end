import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRoom } from '../common/entities/chatroom.entity';
import { ChatUser } from '../common/entities/chatuser.entity';
import { User } from '../common/entities/user.entity';
import { ChatRole, ChatRoomMode, ChatUserStatus } from '../common/enums';
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
import * as bcrypt from 'bcrypt';
import { Block } from 'src/common/entities/block.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(ChatUser)
    private chatUserRepository: Repository<ChatUser>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Block)
    private blockRepository: Repository<Block>,
    private muteTimeRepository: MuteTimeRepository,
    private chatGateway: ChatGateway,
  ) {}

  private defaultMuteTime: Date = new Date('1970-01-01T00:00:00.000Z');

  async getChatUserDto(chatUser: ChatUser): Promise<ChatUserDto> {
    const user: User = await this.findExistUser(chatUser.userId);
    return new ChatUserDto(user.id, user.userName, user.avatar, chatUser.role, chatUser.muteTime);
  }

  async getChatUserList(chatUsers: ChatUser[], isBanned: boolean): Promise<ChatUserDto[]> {
    chatUsers = isBanned
      ? chatUsers.filter((chatUser: ChatUser) => chatUser.status === ChatUserStatus.BAN)
      : chatUsers.filter((chatUser: ChatUser) => chatUser.status !== ChatUserStatus.BAN);
    const chatUserList: ChatUserDto[] = await Promise.all(
      chatUsers.map((chatUser: ChatUser) => this.getChatUserDto(chatUser)),
    );
    return chatUserList;
  }

  async findUserName(userId: number) {
    const user: User = await this.userRepository.findOne({ where: { id: userId } });
    return user.userName;
  }

  async getChatRoomDto(execChatUser: ChatUser): Promise<ChatRoomDataDto> {
    const chatRoom: ChatRoom = await this.chatRoomRepository.findOne({ where: { id: execChatUser.roomId } });
    const chatUsers: ChatUser[] = await this.chatUserRepository.find({
      where: { roomId: execChatUser.roomId, userId: Not(execChatUser.userId) },
    });
    const chatRoomData = new ChatRoomDataDto(
      chatRoom.id,
      chatRoom.roomMode === ChatRoomMode.DIRECT ? await this.findUserName(chatUsers[0].userId) : chatRoom.roomName,
      chatRoom.roomMode === ChatRoomMode.DIRECT ? false : true,
      chatRoom.roomMode,
      await this.getChatUserDto(execChatUser),
      await this.getChatUserList(chatUsers, false),
      await this.getChatUserList(chatUsers, true),
    );
    return chatRoomData;
  }

  async getChatRoomList(userId: number): Promise<ChatRoomDataDto[]> {
    const targetUser = await this.findExistUser(userId);
    const userChatProfiles = await this.chatUserRepository.find({
      where: { userId: targetUser.id, status: Not(ChatUserStatus.BAN) },
    });
    const chatRoomList: ChatRoomDataDto[] = await Promise.all(
      userChatProfiles.map(async (userChatProfile: ChatUser) => await this.getChatRoomDto(userChatProfile)),
    );
    return chatRoomList;
  }

  async enterChatRoom(userId: number, chatRoom: EnterChatRoomDto): Promise<ChatRoomDataDto> {
    const targetRoom = await this.findExistChatRoom(chatRoom.roomId);
    if (targetRoom.roomMode === ChatRoomMode.PROTECTED) {
      if (typeof chatRoom.password !== 'string') throw new BadRequestException('Need a password to enter the chatroom');
      if (bcrypt.compareSync(chatRoom.password, targetRoom.password) == false) {
        throw new BadRequestException('Incorrect Password');
      }
    }
    await this.checkUserAlreadyEntered(chatRoom.roomId, userId);
    const newChatUser: ChatUser = ChatUser.from(
      chatRoom.roomId,
      userId,
      ChatUserStatus.NONE,
      ChatRole.USER,
      this.defaultMuteTime,
    );
    await this.joinChatRoom(newChatUser);
    return this.getChatRoomDto(newChatUser);
  }

  async createChatOwner(roomId: number, userId: number) {
    const newChatOwner: ChatUser = ChatUser.from(
      roomId,
      userId,
      ChatUserStatus.NONE,
      ChatRole.OWNER,
      this.defaultMuteTime,
    );
    const createdOwner = await this.chatUserRepository.save(newChatOwner);
    // await this.joinChatRoom(createdOwner);
    return createdOwner;
  }

  async createDMRoom(userId: number, newRoomInfo: newChatRoomDto): Promise<ChatRoomDto> {
    const inviter: User = await this.findExistUser(userId);
    if (!newRoomInfo.userId) throw new BadRequestException('DM need a target user');
    const invitee: User = await this.findExistUser(newRoomInfo.userId);

    const blocking: Block = await this.blockRepository.findOne({ where: { toId: invitee.id, fromId: inviter.id } });
    const blocked: Block = await this.blockRepository.findOne({ where: { toId: inviter.id, fromId: invitee.id } });
    if (blocking) throw new BadRequestException('you blocked DM target user');
    if (blocked) throw new BadRequestException('you have been blocked by DM target user');
    newRoomInfo.roomName = invitee.userName;
    newRoomInfo.password = null;
    const newRoom = await this.chatRoomRepository.save(newRoomInfo.toChatRoomEntity());
    const inviteUser: ChatUser = await this.createChatOwner(newRoom.id, userId);
    const invitedUser: ChatUser = await this.createChatOwner(newRoom.id, newRoomInfo.userId);
    this.chatGateway.sendAddedRoom(invitedUser.userId, await this.getChatRoomDto(invitedUser));
    this.joinChatRoom(inviteUser);
    this.joinChatRoom(invitedUser);
    return new ChatRoomDto(newRoom.id, newRoom.roomName, newRoom.roomMode);
  }

  async createChatRoom(userId: number, newRoomInfo: newChatRoomDto): Promise<ChatRoomDto> {
    if (newRoomInfo.roomMode === ChatRoomMode.DIRECT) return this.createDMRoom(userId, newRoomInfo);
    await this.findExistUser(userId);
    if (newRoomInfo.roomMode === ChatRoomMode.PROTECTED) {
      if (!newRoomInfo.password) throw new BadRequestException('Protected room need a password');
    } else {
      newRoomInfo.password = null;
    }
    const newRoom = await this.chatRoomRepository.save(newRoomInfo.toChatRoomEntity());
    await this.joinChatRoom(await this.createChatOwner(newRoom.id, userId));
    return new ChatRoomDto(newRoom.id, newRoom.roomName, newRoom.roomMode);
  }

  async inviteChatUser(userId: number, invitedChatUser: FindChatUserDto) {
    const targetRoom = await this.findExistChatRoom(invitedChatUser.roomId);
    const execUser: ChatUser = await this.findExistChatUser(invitedChatUser.roomId, userId);
    this.checkChatUserAuthority(execUser, ChatRole.ADMIN);
    const targetUser: User = await this.findExistUser(invitedChatUser.userId);
    await this.checkUserAlreadyEntered(invitedChatUser.roomId, invitedChatUser.userId);
    const newChatUser: ChatUser = ChatUser.from(
      targetRoom.id,
      targetUser.id,
      ChatUserStatus.NONE,
      ChatRole.USER,
      this.defaultMuteTime,
    );

    await this.joinChatRoom(newChatUser);
    this.chatGateway.sendAddedRoom(newChatUser.userId, await this.getChatRoomDto(newChatUser));
  }

  async findFreshChannels(userId: number) {
    await this.findExistUser(userId);
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

  async changeChatRoomInfo(userId: number, changeRoomInfo: ChangeChatRoomDto) {
    const targetRoom = await this.findExistChatRoom(changeRoomInfo.roomId);
    await this.isValidChatRoomToChage(targetRoom.id);
    const execUser = await this.findExistChatUser(changeRoomInfo.roomId, userId);
    this.checkChatUserAuthority(execUser, ChatRole.OWNER);
    if (changeRoomInfo.roomMode) targetRoom.roomMode = changeRoomInfo.roomMode;
    if (changeRoomInfo.roomMode === ChatRoomMode.PROTECTED) {
      if (typeof changeRoomInfo.password !== 'string')
        throw new BadRequestException('Need a password for protected room');
      targetRoom.password = changeRoomInfo.password;
    }
    if (changeRoomInfo.roomMode !== ChatRoomMode.PROTECTED) {
      targetRoom.password = null;
    }
    await this.chatRoomRepository.save(targetRoom);
    return;
  }

  async changeChatUserRole(userId: number, newChatRole: UpdateChatRoleDto) {
    const execUser = await this.findExistChatUser(newChatRole.roomId, userId);
    this.checkChatUserAuthority(execUser, ChatRole.OWNER);
    const targetUser = await this.findExistChatUser(newChatRole.roomId, newChatRole.userId);
    this.isValidChatUserToChange(targetUser);
    await this.isValidChatRoomToChage(newChatRole.roomId);
    targetUser.role = newChatRole.role;
    await this.chatUserRepository.save(targetUser);
    const changedRole: ChangedUserRoleDto = new ChangedUserRoleDto();
    changedRole.userName = (await this.userRepository.findOne({ where: { id: targetUser.userId } })).userName;
    changedRole.changedRole = targetUser.role;
    this.chatGateway.sendUserMode({ roomId: targetUser.roomId, userId: targetUser.userId, role: targetUser.role });
    return;
  }

  async kickChatUser(kickChatUser: UpdateChatStatusDto) {
    const targetUser = await this.findExistChatUser(kickChatUser.roomId, kickChatUser.userId);
    this.isValidChatUserToChange(targetUser);
    await this.chatUserRepository.remove(targetUser);
  }

  async banChatUser(banChatUser: UpdateChatStatusDto) {
    const targetChatUser: ChatUser = await this.chatUserRepository.findOne({
      where: { roomId: banChatUser.roomId, userId: banChatUser.userId },
    });
    const userToBan: ChatUser = targetChatUser
      ? targetChatUser
      : ChatUser.from(banChatUser.roomId, banChatUser.userId, ChatUserStatus.BAN, ChatRole.USER, this.defaultMuteTime);
    this.isValidChatUserToChange(userToBan);
    userToBan.status = banChatUser.status;
    await this.chatUserRepository.save(userToBan);
  }

  async muteChatUser(muteChatUser: UpdateChatStatusDto) {
    const targetUser = await this.findExistChatUser(muteChatUser.roomId, muteChatUser.userId);
    this.isValidChatUserToChange(targetUser);

    targetUser.status = muteChatUser.status;
    targetUser.muteTime = this.updateMuteTime(targetUser, muteChatUser);
    await this.chatUserRepository.save(targetUser);
  }

  async revertChatStatus(revertStatus: UpdateChatStatusDto) {
    const targetUser = await this.findExistChatUser(revertStatus.roomId, revertStatus.userId);
    const prevStatus = targetUser.status;
    this.isValidChatUserToChange(targetUser);
    if (prevStatus == ChatUserStatus.BAN) {
      await this.chatUserRepository.remove(targetUser);
      return ChatUserStatus.BAN;
    }
    targetUser.status = revertStatus.status;
    targetUser.muteTime = this.updateMuteTime(targetUser, revertStatus);
    await this.chatUserRepository.save(targetUser);
    return ChatUserStatus.MUTE;
  }

  updateMuteTime(targetUser: ChatUser, newChatStatus: UpdateChatStatusDto): Date {
    if (newChatStatus.status == ChatUserStatus.MUTE) {
      if (!newChatStatus.muteTime || typeof newChatStatus.muteTime === 'undefined')
        throw new BadRequestException('Need limited mute time');
      this.muteTimeRepository.save(targetUser.roomId, targetUser.userId, new Date(newChatStatus.muteTime));
      return newChatStatus.muteTime;
    } else {
      this.muteTimeRepository.delete(targetUser.roomId, targetUser.userId);
      return this.defaultMuteTime;
    }
  }

  async changeChatUserStatus(userId: number, newChatStatus: UpdateChatStatusDto) {
    const execUser = await this.findExistChatUser(newChatStatus.roomId, userId);
    this.checkChatUserAuthority(execUser, ChatRole.ADMIN);
    await this.isValidChatRoomToChage(newChatStatus.roomId);

    const targetRoomId = execUser.roomId;
    const targetUserId = newChatStatus.userId;

    switch (newChatStatus.status) {
      case ChatUserStatus.KICK:
        await this.kickChatUser(newChatStatus);
        this.chatGateway.sendKick(targetUserId, { roomId: targetRoomId, userId: targetUserId });
        this.chatGateway.leaveFromRoom(targetUserId, targetRoomId);
        this.chatGateway.sendLeave({ roomId: targetRoomId, userId: targetUserId });
        break;
      case ChatUserStatus.BAN:
        await this.banChatUser(newChatStatus);
        const user = await this.userRepository.findOne({ where: { id: targetUserId } });
        this.chatGateway.leaveFromRoom(targetUserId, targetRoomId);
        this.chatGateway.sendBan({
          roomId: targetRoomId,
          userId: targetUserId,
          name: user?.userName,
          avatarURL: user?.avatar,
        });
        break;
      case ChatUserStatus.MUTE:
        await this.muteChatUser(newChatStatus);
        this.chatGateway.sendMute({
          roomId: targetRoomId,
          userId: targetUserId,
          abongTime: newChatStatus.muteTime,
        });
        break;
      case ChatUserStatus.NONE:
        const ret: ChatUserStatus = await this.revertChatStatus(newChatStatus);
        if (ret === ChatUserStatus.BAN) {
          this.chatGateway.sendUnban({ roomId: targetRoomId, userId: targetUserId });
        } else {
          this.chatGateway.sendMute({
            roomId: targetRoomId,
            userId: targetUserId,
            abongTime: this.defaultMuteTime,
          });
        }
        break;
    }
  }

  async joinChatRoom(chatUser: ChatUser) {
    await this.chatUserRepository.save(chatUser);
    const user = await this.userRepository.findOne({ where: { id: chatUser.userId } });

    this.chatGateway.sendJoin({
      roomId: chatUser.roomId,
      userId: chatUser.userId,
      name: user?.userName,
      avatarURL: user?.avatar,
    });
    this.chatGateway.joinToRoom(chatUser.userId, chatUser.roomId);
  }

  async leaveChatRoom(chatUser: ChatUser) {
    this.chatGateway.leaveFromRoom(chatUser.userId, chatUser.roomId);
    this.chatGateway.sendLeave({
      roomId: chatUser.roomId,
      userId: chatUser.userId,
    });
    await this.chatUserRepository.remove(chatUser);
  }

  async destroyChatRoom(targetRoom: ChatRoom) {
    const chatUsers: ChatUser[] = await this.chatUserRepository.find({ where: { roomId: targetRoom.id } });
    chatUsers.map(async (x: ChatUser) => await this.leaveChatRoom(x));
    await this.chatRoomRepository.remove(targetRoom);
  }

  async exitChatRoom(userId: number, roomId: number) {
    const targetRoom: ChatRoom = await this.findExistChatRoom(roomId);
    const exitUser = await this.findExistChatUser(roomId, userId);
    if (exitUser.role !== ChatRole.OWNER) {
      await this.leaveChatRoom(exitUser);
    } else {
      await this.destroyChatRoom(targetRoom);
    }
  }

  /**
   * userId를 통해 user 테이블 내 유저를 찾습니다.
   * @param userId 찾고자 하는 유저 id
   * @returns 성공시 해당 유저의 Entity를 반환합니다. 싫패시 NotFoundException을 던집니다.
   */
  async findExistUser(userId: number) {
    const targetUser: User = await this.userRepository.findOneBy({ id: userId });
    if (!targetUser) throw new NotFoundException('No Such User');
    return targetUser;
  }

  /**
   * roomId, userId를 통해 chat_user 테이블 내 채팅 유저를 찾습니다.
   * @param roomId 유저가 속한 방 id
   * @param chatUserId 유저 id
   * @returns 성공시 해당 채팅유저의 Entity를 반환합니다. 실패시 NotFoundException을 던집니다.
   */
  async findExistChatUser(roomId: number, chatUserId: number) {
    const targetChatUser: ChatUser = await this.chatUserRepository.findOne({
      where: { roomId: roomId, userId: chatUserId },
    });
    if (!targetChatUser) throw new NotFoundException('No Such ChatUser');
    return targetChatUser;
  }

  /**
   * roomId를 통해 chat_room 테이블 내 채팅방을 찾습니다.
   * @param roomId 찾고자 하는 채팅방 id
   * @returns 성공시 해당 채팅방 Entity를 반환합니다. 실패시 NotFoundException을 던집니다.
   */
  async findExistChatRoom(roomId: number) {
    const targetChatRoom: ChatRoom = await this.chatRoomRepository.findOneBy({ id: roomId });
    if (!targetChatRoom) throw new NotFoundException('No Such ChatRoom');
    return targetChatRoom;
  }

  /**
   * roomId, userId를 통해 해당 채팅 유저가 Ban을 당했는지 아닌지 확인합니다.
   * @param roomId 유저가 속한 방 id
   * @param chatUserId 유저 id
   * @returns 해당 채팅 유저가 존재한다면 그 유저의 Entity를 반환합니다. Ban을 당한 유저인 경우 BadRequestException을 던집니다.
   * 없는 유저라면 null을 반환합니다.
   */
  async checkChatUserBanned(roomId: number, chatUserId: number) {
    const targetChatUser: ChatUser = await this.chatUserRepository.findOne({
      where: { roomId: roomId, userId: chatUserId },
    });
    if (targetChatUser) {
      if (targetChatUser.status === ChatUserStatus.BAN) throw new BadRequestException('The User Has Been Banned');
    }
    return targetChatUser;
  }

  async checkUserAlreadyEntered(roomId: number, userId: number) {
    const targetUser: ChatUser = await this.chatUserRepository.findOne({ where: { roomId: roomId, userId: userId } });
    if (targetUser) throw new BadRequestException('The User Has Been Already Entered');
  }

  /**
   * API를 요청한 ChatUser가 실행권한이 있는지 판단합니다.
   * API 실행을 요청한 채팅 유저의 권한이  최소 실행 권한보다 낮은 경우 ForbiddenException을 던집니다.
   * @param execChatUser API를 요청한 채팅 유저
   * @param minimumRole API 실행을 위해 필요한 최소 실행 권한
   */
  checkChatUserAuthority(execChatUser: ChatUser, minimumRole: ChatRole) {
    switch (execChatUser.role) {
      case ChatRole.USER:
        throw new ForbiddenException('The User Has No Permission');
      case ChatRole.ADMIN:
        if (minimumRole === ChatRole.OWNER) throw new ForbiddenException('The User Has No Permission');
        break;
      case ChatRole.OWNER:
        break;
    }
  }

  /**
   * API의 타겟이 되는 채팅방이 정보 변경이 가능한 채팅방 (DM이 아닌 방)인지 판단 합니다.
   * parameter로 들어온 채팅방 id가 정보 변경이 불가능한 DM방인 경우 BadRequestException을 던집니다.
   * @param roomId API의 타겟이 되는 채팅방 id
   */
  async isValidChatRoomToChage(roomId: number) {
    const targetRoom = await this.chatRoomRepository.findOne({ where: { id: roomId } });
    if (targetRoom.roomMode === ChatRoomMode.DIRECT) throw new BadRequestException('Can not change DM channel');
  }

  /**
   * API의 타겟이 되는 유저가 상태 및 역할이 변경 가능한 유저인지 확인합니다.
   * 상태 및 역할 변경이 불가능한 OWNER 인 경우 BadRequestException을 던집니다.
   * @param targetChatUser API의 타겟이 되는 유저
   */
  isValidChatUserToChange(targetChatUser: ChatUser) {
    if (targetChatUser.role === ChatRole.OWNER) throw new BadRequestException('Can Not Change Channel Owner');
  }
}
