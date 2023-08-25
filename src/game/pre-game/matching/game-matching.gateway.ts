import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserSocketRepository } from 'src/repository/user-socket.repository';
import { MatchingRepository } from 'src/repository/matching.repository';
import { QueueRepository } from 'src/repository/queue.repository';
import { Repository } from 'typeorm';
import { User } from 'src/common/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserState, UserStateRepository } from 'src/repository/user-state.repository';

const GameMatchingEvent = {
  matched: 'matched',
  timeout: 'timeout',
  confirm: 'confirm',
};

interface GameUser {
  id: number;
  name: string;
  avatarURL: string;
}

interface EmitConfirm {
  result: boolean;
  leftUser: GameUser | undefined;
  rightUser: GameUser | undefined;
  gameRoomId: number | undefined;
}

interface EmitMatched {
  matchingId: number;
  endTimeMs: number;
}

@WebSocketGateway()
export class GameMatchingGateway {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userSocketRepository: UserSocketRepository,
    private readonly matchingRepository: MatchingRepository,
    private readonly queueRepository: QueueRepository,
    private readonly userStateRepository: UserStateRepository,
  ) {}

  @WebSocketServer()
  server: Server;

  sendMatching(userId: number, matchingId: { matchingId: number; endTimeMs: number }): void {
    const userSocket: string | undefined = this.userSocketRepository.find(userId);

    if (!userSocket) return;
    const data: EmitMatched = {
      matchingId: matchingId.matchingId,
      endTimeMs: matchingId.endTimeMs,
    };
    this.server.to(userSocket).emit(GameMatchingEvent.matched, data);
  }

  sendMatchingTimeout(user1: number, user2: number) {
    const user1Socket: string | undefined = this.userSocketRepository.find(user1);
    const user2Socket: string | undefined = this.userSocketRepository.find(user2);

    if (user1Socket !== undefined) this.server.to(user1Socket).emit(GameMatchingEvent.timeout);
    if (user2Socket !== undefined) this.server.to(user2Socket).emit(GameMatchingEvent.timeout);
  }

  isUserInMatching(connectedSocketId: string, user1Id: number, user2Id: number): boolean {
    const user1Socket = this.userSocketRepository.find(user1Id);
    const user2Socket = this.userSocketRepository.find(user2Id);
    if (user1Socket === connectedSocketId || user2Socket === connectedSocketId) return true;
    return false;
  }

  @SubscribeMessage('accept-matching')
  async acceptMatching(@ConnectedSocket() connected: Socket, @MessageBody() acceptMatchingDto: { matchingId: number }) {
    const matching = this.matchingRepository.find(acceptMatchingDto.matchingId);
    if (matching === undefined) return;

    if (this.isUserInMatching(connected.id, matching.user1Id, matching.user2Id) === false) return;

    if (matching.accept === false) {
      matching.accept = true;
      this.matchingRepository.update(acceptMatchingDto.matchingId, matching);
      return;
    }

    // 매칭 성공 메세지 보내기
    const user1: User = await this.userRepository.findOne({ where: { id: matching.user1Id } });
    const user2: User = await this.userRepository.findOne({ where: { id: matching.user2Id } });

    let changeState: () => void = undefined;
    let data: EmitConfirm = undefined;

    if (user1 && user2) {
      // TODO: GENERATE GAME
      data = {
        result: true,
        leftUser: {
          id: user1.id,
          name: user1.userName,
          // FIXME:
          avatarURL: user1.email,
        },
        rightUser: {
          id: user2.id,
          name: user2.userName,
          // FIXME:
          avatarURL: user2.email,
        },
        gameRoomId: 1,
      };
      changeState = (): void => {
        this.userStateRepository.update(matching.user1Id, UserState.IN_GAME);
        this.userStateRepository.update(matching.user2Id, UserState.IN_GAME);
      };
    } else {
      data = {
        result: false,
        leftUser: undefined,
        rightUser: undefined,
        gameRoomId: undefined,
      };
      changeState = (): void => {
        this.userStateRepository.update(matching.user1Id, UserState.IDLE);
        this.userStateRepository.update(matching.user2Id, UserState.IDLE);
      };
    }

    this.matchingRepository.delete(acceptMatchingDto.matchingId);
    const user1Socket: string | undefined = this.userSocketRepository.find(matching.user1Id);
    const user2Socket: string | undefined = this.userSocketRepository.find(matching.user2Id);
    if (user1Socket !== undefined) this.server.to(user1Socket).emit(GameMatchingEvent.confirm, data);
    if (user2Socket !== undefined) this.server.to(user2Socket).emit(GameMatchingEvent.confirm, data);
    changeState();
  }

  @SubscribeMessage('reject-matching')
  async rejectMatching(@ConnectedSocket() connected: Socket, @MessageBody() rejectMatchingDto: { matchingId: number }) {
    const matching = this.matchingRepository.find(rejectMatchingDto.matchingId);
    if (matching === undefined) return;
    if (this.isUserInMatching(connected.id, matching.user1Id, matching.user2Id) === false) return;

    this.matchingRepository.delete(rejectMatchingDto.matchingId);

    let accepterSocket: string = undefined;
    const user1Socket: string | undefined = this.userSocketRepository.find(matching.user1Id);
    const user2Socket: string | undefined = this.userSocketRepository.find(matching.user2Id);

    if (user1Socket === connected.id) accepterSocket = user2Socket;
    else accepterSocket = user1Socket;

    const data: EmitConfirm = {
      result: false,
      leftUser: undefined,
      rightUser: undefined,
      gameRoomId: undefined,
    };
    this.server.to(accepterSocket).emit(GameMatchingEvent.confirm, data);
    this.userStateRepository.update(matching.user1Id, UserState.IDLE);
    this.userStateRepository.update(matching.user2Id, UserState.IDLE);
  }
}
