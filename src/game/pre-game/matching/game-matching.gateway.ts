import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserSocketRepository } from 'src/repository/user-socket.repository';
import { MatchingRepository } from 'src/repository/matching.repository';
import { QueueRepository } from 'src/repository/queue.repository';
import { Repository } from 'typeorm';
import { User } from 'src/common/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserState, UserStateRepository } from 'src/repository/user-state.repository';
import { EmitConfirm, EmitMatched, Game } from 'src/game/game';
import { GameConnectGateway } from '../game-connect.gateway';

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
    private readonly gameConnectGateway: GameConnectGateway,
  ) {}

  @WebSocketServer()
  server: Server;

  sendMatching(userId: number, matchingId: number): void {
    const userSocket: string | undefined = this.userSocketRepository.find(userId);

    if (!userSocket) return;
    const data: EmitMatched = {
      matchingId: matchingId,
      endTimeMs: new Date().getTime() + 1500,
    };
    this.server.to(userSocket).emit(GameMatchingEvent.matched, data);
  }

  sendMatchingTimeout(user1: number, user2: number) {
    const user1Socket: string | undefined = this.userSocketRepository.find(user1);
    const user2Socket: string | undefined = this.userSocketRepository.find(user2);

    if (user1Socket !== undefined) this.server.to(user1Socket).emit(GameMatchingEvent.timeout);
    if (user2Socket !== undefined) this.server.to(user2Socket).emit(GameMatchingEvent.timeout);
  }

  @SubscribeMessage('accept-matching')
  async acceptMatching(@MessageBody() acceptMatchingDto: { matchingId: number }) {
    const matching = this.matchingRepository.find(acceptMatchingDto.matchingId);
    if (matching === undefined) return;
    if (matching.accept === false) {
      matching.accept = true;
      this.matchingRepository.update(acceptMatchingDto.matchingId, matching);
      return;
    }

    // 매칭 성공 메세지 보내기
    const user1Socket: string | undefined = this.userSocketRepository.find(matching.user1Id);
    const user2Socket: string | undefined = this.userSocketRepository.find(matching.user2Id);

    const newGame: Game | null = await this.gameConnectGateway.createNewGame(matching, user1Socket, user2Socket);
    const confirmData: EmitConfirm = new EmitConfirm(newGame); // newGame ? Game.result == true:  Game.result == false;
    this.matchingRepository.delete(acceptMatchingDto.matchingId);

    // socket을 찾았을때만 emit;
    if (user1Socket !== undefined) this.server.to(user1Socket).emit(GameMatchingEvent.confirm, confirmData);
    if (user2Socket !== undefined) this.server.to(user2Socket).emit(GameMatchingEvent.confirm, confirmData);

    // changeState();
    this.gameConnectGateway.updateGameUserState(matching, confirmData);

    // enter to the gameRoom;
    if (newGame) this.gameConnectGateway.enterGameRoom(newGame);
  }

  @SubscribeMessage('reject-matching')
  async rejectMatching(@ConnectedSocket() connected: Socket, @MessageBody() rejectMatchingDto: { matchingId: number }) {
    const matching = this.matchingRepository.find(rejectMatchingDto.matchingId);
    if (matching === undefined) return;
    this.matchingRepository.delete(rejectMatchingDto.matchingId);

    let accepterSocket: string = undefined;
    let accepterId: number = undefined;
    let changeState: () => void = undefined;
    const user1Socket: string | undefined = this.userSocketRepository.find(matching.user1Id);
    const user2Socket: string | undefined = this.userSocketRepository.find(matching.user2Id);

    if (user1Socket === connected.id) {
      accepterSocket = user2Socket;
      accepterId = matching.user2Id;
      changeState = () => {
        this.userStateRepository.update(matching.user2Id, UserState.IN_QUEUE);
        this.userStateRepository.update(matching.user1Id, UserState.IDLE);
      };
    } else if (user2Socket === connected.id) {
      accepterSocket = user1Socket;
      accepterId = matching.user1Id;
      changeState = () => {
        this.userStateRepository.update(matching.user1Id, UserState.IN_QUEUE);
        this.userStateRepository.update(matching.user2Id, UserState.IDLE);
      };
    } else {
      this.userStateRepository.update(matching.user1Id, UserState.IDLE);
      this.userStateRepository.update(matching.user2Id, UserState.IDLE);
      return;
    }

    const data: EmitConfirm = new EmitConfirm(null);
    this.server.to(accepterSocket).emit(GameMatchingEvent.confirm, data);
    const user: User = await this.userRepository.findOne({ where: { id: accepterId } });
    if (user !== null) this.queueRepository.save([user.id, user.rating]);
    changeState();
  }
}
