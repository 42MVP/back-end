import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRoom } from '../database/entities/chatroom.entity';
import { ChatUser } from '../database/entities/chatuser.entity';
import { User } from '../database/entities/user.entity';
import { ChatRole, ChatRoomMode, ChatUserStatus } from '../database/entities/enums';
import { CreateChatUserDto } from './dto/request/create-chat-user.dto';
import { UpdateChatUserDto } from './dto/request/update-chat-user.dto';
import { UpdateChatRoomDto } from './dto/request/update-chat-room.dto';
import { CreateChatRoomDto } from './dto/request/create-chat-room.dto';
import { UserSocketRepository } from '../repository/user-socket.repository';
import { ChatGateway } from './chat.gateway';
import { ChangedUserRoleDto } from './dto/response/changed-user-role.dto';
import { ChangedUserStatusDto } from './dto/response/changed-user-status.dto';
import { ExitChatRoomDto } from './dto/request/exit-chat-room.dto';
import { ChatRoomDataDto } from './dto/response/chat-room-data.dto';
import { ChatUserDto } from './dto/response/chat-user.dto';
import { ChatSearchResultDto } from './dto/response/chat-search-result.dto';

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

  async extractChatUserDto(chatUsers: ChatUser[]): Promise<ChatUserDto[]> {
    const chatUserDtoList: ChatUserDto[] = [];
    for (let index = 0; index < chatUsers.length; index++) {
      const chatUserData = chatUsers[index];
      const userData = await this.userRepository.findOne({ where: { id: chatUserData.userId } });
      const chatUserDto = new ChatUserDto(
        userData.id,
        userData.userName,
        // TODO: 임시로 작성한 avatarUrl 차후 수정
        '',
        chatUserData.role,
        chatUserData.muteTime,
      );
      chatUserDtoList.push(chatUserDto);
    }
    return chatUserDtoList;
  }

  async extractChatRoomDataDto(targetRoom: ChatRoom): Promise<ChatRoomDataDto> {
    const chatRoomData = new ChatRoomDataDto(
      targetRoom.id,
      targetRoom.roomMode != 'DIRECT' ? true : false,
      targetRoom.roomName,
      targetRoom.password == null ? false : true,
      await this.extractChatUserDto(
        await this.chatUserRepository.find({
          where: { roomId: targetRoom.id, status: ChatUserStatus.NONE },
        }),
      ),
      await this.extractChatUserDto(
        await this.chatUserRepository.find({
          where: { roomId: targetRoom.id, status: ChatUserStatus.BAN },
        }),
      ),
      await this.extractChatUserDto(
        await this.chatUserRepository.find({
          where: { roomId: targetRoom.id, status: ChatUserStatus.MUTE },
        }),
      ),
    );
    return chatRoomData;
  }

  async getChatRoomList(userName: string): Promise<ChatRoomDataDto[]> {
    const targetUser = await this.userRepository.findOne({ where: { userName: userName } });
    if (!targetUser) {
      throw new BadRequestException('Can not find target user');
    }
    const chatUsers = await this.chatUserRepository.find({ where: { userId: targetUser.id } });
    const chatRoomDataDtoList: ChatRoomDataDto[] = [];
    for (let index = 0; index < chatUsers.length; index++) {
      const chatUser = chatUsers[index];
      const chatRoom: ChatRoom = await this.chatRoomRepository.findOne({ where: { id: chatUser.roomId } });
      chatRoomDataDtoList.push(await this.extractChatRoomDataDto(chatRoom));
    }
    return chatRoomDataDtoList;
  }

  async enterChatRoom(newChatUser: CreateChatUserDto): Promise<ChatUser> {
    const isExistUser = await this.chatUserRepository.findOne({
      where: { roomId: newChatUser.roomId, userId: newChatUser.userId },
    });
    if (isExistUser && isExistUser.status == ChatUserStatus.BAN) {
      throw new BadRequestException('The user has been banned');
    }
    const targetRoom = await this.chatRoomRepository.findOne({ where: { id: newChatUser.roomId } });
    if (targetRoom.roomMode == ChatRoomMode.PROTECTED && targetRoom.password != newChatUser.roomPassword) {
      throw new BadRequestException('Wrong Password');
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
    const allChannel = await this.chatRoomRepository.find();
    const searchResult: ChatSearchResultDto[] = [];
    for (let index = 0; index < allChannel.length; index++) {
      const chat = allChannel[index];
      if (chat.roomMode != ChatRoomMode.DIRECT && chat.roomMode != ChatRoomMode.PRIVATE) {
        const chatSearchDto = new ChatSearchResultDto(chat.id, chat.roomName, chat.password ? true : false);
        searchResult.push(chatSearchDto);
      }
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
