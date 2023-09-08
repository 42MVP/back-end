import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserSocketRepository } from 'src/repository/user-socket.repository';
import { Matching, MatchingAcceptUser, MatchingRepository } from 'src/repository/matching.repository';
import { UserState, UserStateRepository } from 'src/repository/user-state.repository';
import { EmitConfirm, EmitInit, EmitMatched, Game } from 'src/game/game';
import { GameConnectGateway } from '../game-connect.gateway';
import { GameMainGateway } from 'src/game/game-main/game-main.gateway';

const GameMatchingEvent = {
  matched: 'matched',
  timeout: 'timeout',
  confirm: 'confirm',
};

class MatchingUsersSocket {
  private user1Socket: string | undefined;
  private user2Socket: string | undefined;

  constructor(user1Socket: string, user2Socket: string) {
    this.user1Socket = user1Socket;
    this.user2Socket = user2Socket;
  }

  get user1(): string | undefined {
    return this.user1Socket;
  }

  get user2(): string | undefined {
    return this.user2Socket;
  }

  areAvailable(): boolean {
    if (this.user1Socket !== undefined && this.user2Socket !== undefined) return true;
    return false;
  }

  checkSocketPermission(connectedSocketId: string): boolean {
    if (this.user1Socket === connectedSocketId || this.user2Socket === connectedSocketId) return true;
    return false;
  }
}

@WebSocketGateway()
export class GameMatchingGateway {
  constructor(
    private readonly userSocketRepository: UserSocketRepository,
    private readonly matchingRepository: MatchingRepository,
    private readonly userStateRepository: UserStateRepository,
    private readonly gameConnectGateway: GameConnectGateway,
    private readonly gameMainGateway: GameMainGateway,
  ) {}

  @WebSocketServer()
  server: Server;

  sendMatching(userId: number, matchingData: { matchingId: number; endTimeMs: number }): void {
    const userSocket: string | undefined = this.userSocketRepository.find(userId);

    if (!userSocket) return;
    const data: EmitMatched = {
      matchingId: matchingData.matchingId,
      endTimeMs: matchingData.endTimeMs,
    };
    this.server.to(userSocket).emit(GameMatchingEvent.matched, data);
  }

  sendMatchingTimeout(userId: number): void {
    const userSocket: string | undefined = this.userSocketRepository.find(userId);

    if (userSocket !== undefined) this.server.to(userSocket).emit(GameMatchingEvent.timeout);
  }

  sendMatchingRejected(userId: number): void {
    const userSocket: string | undefined = this.userSocketRepository.find(userId);
    const data: EmitConfirm = {
      result: false,
      leftUser: undefined,
      rightUser: undefined,
      gameRoomId: undefined,
    };

    if (userSocket) this.server.to(userSocket).emit(GameMatchingEvent.confirm, data);
  }

  getMatchingUsersSocket(matching: Matching): MatchingUsersSocket {
    const user1Socket = this.userSocketRepository.find(matching.user1Id);
    const user2Socket = this.userSocketRepository.find(matching.user2Id);

    return new MatchingUsersSocket(user1Socket, user2Socket);
  }

  @SubscribeMessage('accept-matching')
  async acceptMatching(@ConnectedSocket() connected: Socket, @MessageBody() acceptMatchingDto: { matchingId: number }) {
    const matching: Matching = this.matchingRepository.find(acceptMatchingDto.matchingId);
    if (matching === undefined) return;

    const sockets: MatchingUsersSocket = this.getMatchingUsersSocket(matching);
    if (!sockets.areAvailable()) return;
    if (!sockets.checkSocketPermission(connected.id)) return;

    if (matching.accept === MatchingAcceptUser.NONE) {
      if (connected.id === sockets.user1) matching.accept = MatchingAcceptUser.USER_1;
      else matching.accept = MatchingAcceptUser.USER_2;
      this.matchingRepository.update(acceptMatchingDto.matchingId, matching);
      return;
    }

    // 매칭 성공 메세지 보내기

    const newGame: Game | null = await this.gameConnectGateway.createNewGame(
      matching.gameMode,
      matching.user1Id,
      matching.user2Id,
      sockets.user1,
      sockets.user2,
    );
    const confirmData: EmitConfirm = new EmitConfirm(newGame); // newGame ? Game.result == true:  Game.result == false;
    this.matchingRepository.delete(acceptMatchingDto.matchingId);

    this.server.to(sockets.user1).emit(GameMatchingEvent.confirm, confirmData);
    this.server.to(sockets.user2).emit(GameMatchingEvent.confirm, confirmData);

    // changeState();
    this.gameConnectGateway.updateInGameStatus(matching.user1Id, matching.user2Id, confirmData);

    // enter to the gameRoom;
    if (newGame) {
      this.gameConnectGateway.enterGameRoom(newGame);
      this.server.to(newGame.gameInfo.roomId.toString()).emit('init', new EmitInit(newGame));
      await this.gameMainGateway.waitForGamePlayers(newGame);
    }
  }

  @SubscribeMessage('reject-matching')
  async rejectMatching(@ConnectedSocket() connected: Socket, @MessageBody() rejectMatchingDto: { matchingId: number }) {
    const matching = this.matchingRepository.find(rejectMatchingDto.matchingId);
    if (matching === undefined) return;

    const sockets: MatchingUsersSocket = this.getMatchingUsersSocket(matching);
    if (!sockets.areAvailable()) return;
    if (!sockets.checkSocketPermission(connected.id)) return;

    this.matchingRepository.delete(rejectMatchingDto.matchingId);

    let accepterSocket: string = undefined;

    if (connected.id === sockets.user1) accepterSocket = sockets.user2;
    else accepterSocket = sockets.user1;

    const data: EmitConfirm = new EmitConfirm(null);
    this.server.to(accepterSocket).emit(GameMatchingEvent.confirm, data);
    this.userStateRepository.update(matching.user1Id, UserState.IDLE);
    this.userStateRepository.update(matching.user2Id, UserState.IDLE);
  }
}
