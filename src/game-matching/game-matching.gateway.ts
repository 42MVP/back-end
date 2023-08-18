import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { UserSocketRepository } from 'src/repository/user-socket.repository';
import { MatchingRepository } from 'src/repository/matching.repository';
import { QueueRepository } from 'src/repository/queue.repository';
import { Repository } from 'typeorm';
import { User } from 'src/common/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@WebSocketGateway()
export class GameMatchingGateway {
  constructor(
    private readonly userSocketRepository: UserSocketRepository,
    private readonly matchingRepository: MatchingRepository,
    private readonly queueRepository: QueueRepository,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  @WebSocketServer()
  server: Server;

  sendMatched(usersId: Record<number, number>, matchingId: number): boolean {
    const user1Socket: string | undefined = this.userSocketRepository.find(usersId[0]);
    const user2Socket: string | undefined = this.userSocketRepository.find(usersId[1]);
    if (user1Socket === undefined || user2Socket === undefined) return false;

    const roomName = matchingId.toString();
    this.server.in(user1Socket).socketsJoin(roomName);
    this.server.in(user2Socket).socketsJoin(roomName);
    this.server.to(roomName).emit('matched', {
      matchingId: matchingId,
    });
    return true;
  }

  sendMatchingError(matchingId: number) {
    const matching = this.matchingRepository.find(matchingId);
    const roomName = matchingId.toString();

    if (matching === undefined) {
      return;
    }
    this.server.to(roomName).emit('match-error', {
      msg: 'something was wrong',
    });
    const user1Socket: string | undefined = this.userSocketRepository.find(matching.challengers[0]);
    const user2Socket: string | undefined = this.userSocketRepository.find(matching.challengers[1]);
    if (user1Socket !== undefined) this.server.to(user1Socket).socketsLeave(roomName);
    if (user2Socket !== undefined) this.server.to(user2Socket).socketsLeave(roomName);
  }

  sendTimeout(matchingId: number, user1: number, user2: number) {
    const roomName = matchingId.toString();
    this.matchingRepository.delete(matchingId);
    // 게임 생성 후 ID 알려주기
    this.server.to(roomName).emit('timeout');
    const user1Socket: string | undefined = this.userSocketRepository.find(user1);
    const user2Socket: string | undefined = this.userSocketRepository.find(user2);
    if (user1Socket !== undefined) this.server.to(user1Socket).socketsLeave(roomName);
    if (user2Socket !== undefined) this.server.to(user2Socket).socketsLeave(roomName);
  }

  sendInvite(inviteeId: number, matchingId: number): boolean {
    const inviteeSocket: string | undefined = this.userSocketRepository.find(inviteeId);
    if (inviteeSocket === undefined) return false;
    this.server.to(inviteeSocket).emit('invite', {
      inviterName: '누군가 초대함',
      matchingId: matchingId,
    });
  }

  @SubscribeMessage('accept-matching')
  acceptInvitation(@MessageBody() acceptMatchingDto: { matchingId: number }) {
    const matching = this.matchingRepository.find(acceptMatchingDto.matchingId);
    if (matching === undefined) {
      this.matchingRepository.delete(acceptMatchingDto.matchingId);
      return;
    }
    const roomName = acceptMatchingDto.matchingId.toString();
    this.matchingRepository.delete(acceptMatchingDto.matchingId);
    // 게임 생성 후 ID 알려주기
    this.server.to(roomName).emit('confirm', true);

    const user1Socket: string | undefined = this.userSocketRepository.find(matching.challengers[0]);
    const user2Socket: string | undefined = this.userSocketRepository.find(matching.challengers[1]);
    if (user1Socket !== undefined) this.server.to(user1Socket).socketsLeave(roomName);
    if (user2Socket !== undefined) this.server.to(user2Socket).socketsLeave(roomName);
  }

  @SubscribeMessage('reject-matching')
  async rejectInvitation(@MessageBody() rejectMatchingDto: { userId: number; matchingId: number }) {
    const matching = this.matchingRepository.find(rejectMatchingDto.matchingId);
    if (matching === undefined) {
      this.matchingRepository.delete(rejectMatchingDto.matchingId);
      return;
    }

    let noRejectUserId: number;
    if (matching.challengers[0] === rejectMatchingDto.userId) noRejectUserId = matching.challengers[1];
    else noRejectUserId = matching.challengers[0];
    const noRejecter: string | undefined = this.userSocketRepository.find(noRejectUserId);
    if (noRejecter) this.server.to(noRejecter).emit('confirm', false);
    const user: User = await this.userRepository.findOne({ where: { id: noRejectUserId } });
    if (user !== null) this.queueRepository.save([user.id, user.rating]);

    const roomName = rejectMatchingDto.matchingId.toString();
    const user1Socket: string | undefined = this.userSocketRepository.find(matching.challengers[0]);
    const user2Socket: string | undefined = this.userSocketRepository.find(matching.challengers[1]);
    if (user1Socket !== undefined) this.server.to(user1Socket).socketsLeave(roomName);
    if (user2Socket !== undefined) this.server.to(user2Socket).socketsLeave(roomName);
  }
}
