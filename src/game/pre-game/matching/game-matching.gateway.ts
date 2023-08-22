import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server } from 'socket.io';
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

  sendMatching(userId: number, matchingId: number): void {
    const userSocket: string | undefined = this.userSocketRepository.find(userId);
    const roomName = matchingId.toString();

    if (userSocket === undefined) {
      return;
    }
    this.server.in(userSocket).socketsJoin(roomName);
    this.server.to(userSocket).emit(GameMatchingEvent.matched, { matchingId: matchingId });
  }

  sendMatchingTimeout(matchingId: number, user1: number, user2: number) {
    const roomName = matchingId.toString();
    const user1Socket: string | undefined = this.userSocketRepository.find(user1);
    const user2Socket: string | undefined = this.userSocketRepository.find(user2);

    this.server.to(roomName).emit(GameMatchingEvent.timeout);
    if (user1Socket !== undefined) this.server.to(user1Socket).socketsLeave(roomName);
    if (user2Socket !== undefined) this.server.to(user2Socket).socketsLeave(roomName);
  }

  @SubscribeMessage('accept-matching')
  acceptMatching(@MessageBody() acceptMatchingDto: { matchingId: number }) {
    const matching = this.matchingRepository.find(acceptMatchingDto.matchingId);
    if (matching === undefined) return;
    // 2명 수락
    if (matching.accept === false) {
      matching.accept = true;
      this.matchingRepository.update(acceptMatchingDto.matchingId, matching);
      return;
    }

    // 매칭 데이터  삭제하기
    const roomName = acceptMatchingDto.matchingId.toString();
    this.matchingRepository.delete(acceptMatchingDto.matchingId);

    // 매칭 성공 메세지 보내기
    this.server.to(roomName).emit(GameMatchingEvent.confirm, true);

    // 매칭 소켓 룸에서 삭제하기
    const user1Socket: string | undefined = this.userSocketRepository.find(matching.user1Id);
    const user2Socket: string | undefined = this.userSocketRepository.find(matching.user2Id);
    if (user1Socket !== undefined) this.server.to(user1Socket).socketsLeave(roomName);
    if (user2Socket !== undefined) this.server.to(user2Socket).socketsLeave(roomName);

    this.userStateRepository.update(matching.user1Id, UserState.IN_GAME);
    this.userStateRepository.update(matching.user2Id, UserState.IN_GAME);

    // 게임룸 입장시키기
    // this.tempGateway.joinTestGameRoom(matching.challengers[0], user1Socket, matching.challengers[1], user2Socket);
  }

  @SubscribeMessage('reject-matching')
  async rejectMatching(@MessageBody() rejectMatchingDto: { userId: number; matchingId: number }) {
    const matching = this.matchingRepository.find(rejectMatchingDto.matchingId);
    if (matching === undefined) return;
    this.matchingRepository.delete(rejectMatchingDto.matchingId);

    // 거절 당한 유저 찾기
    let noRejectedUserId: number;
    if (matching.user1Id === rejectMatchingDto.userId) noRejectedUserId = matching.user2Id;
    else noRejectedUserId = matching.user1Id;

    // 거절 당한 유저한테 메세지 보내기
    const noRejecter: string | undefined = this.userSocketRepository.find(noRejectedUserId);
    if (noRejecter) {
      this.server.to(noRejecter).emit(GameMatchingEvent.confirm, false);
      const user: User = await this.userRepository.findOne({ where: { id: noRejectedUserId } });
      if (user !== null) this.queueRepository.save([user.id, user.rating]);
    }

    // 매칭 소켓 룸에서 삭제하기
    const roomName = rejectMatchingDto.matchingId.toString();
    const user1Socket: string | undefined = this.userSocketRepository.find(matching.user1Id);
    const user2Socket: string | undefined = this.userSocketRepository.find(matching.user2Id);
    if (user1Socket !== undefined) this.server.to(user1Socket).socketsLeave(roomName);
    if (user2Socket !== undefined) this.server.to(user2Socket).socketsLeave(roomName);

    this.userStateRepository.update(matching.user1Id, UserState.IDLE);
    this.userStateRepository.update(matching.user2Id, UserState.IDLE);
  }
}
