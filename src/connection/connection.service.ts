import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatUser } from 'src/common/entities/chatuser.entity';
import { ChatUserStatus } from 'src/common/enums';
import { Not, Repository } from 'typeorm';

@Injectable()
export class ConnectionService {
  constructor(
    @InjectRepository(ChatUser)
    private chatUserRepository: Repository<ChatUser>,
  ) {}

  async getUserRoomId(userId: number): Promise<number[]> {
    const ret: ChatUser[] = await this.chatUserRepository.find({
      where: {
        userId: userId,
        status: Not(ChatUserStatus.BAN),
      },
    });
    return ret.map(e => {
      return e.roomId;
    });
  }
}
