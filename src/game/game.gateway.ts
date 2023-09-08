import { ConnectedSocket, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Ball, EmitFinish, EmitInit, Game, GameStatus, Paddle, RenderInfo, defaultSetting } from './game';
import { GameRepository } from 'src/repository/game.repository';
import { clearInterval } from 'timers';
import { UserState, UserStateRepository } from 'src/repository/user-state.repository';
import { GameRatingService } from './game-rating/game-rating.service';
import { GameHistoryService } from 'src/game-history/game-history.service';

@WebSocketGateway()
export class GameGateway {
  constructor(
    private readonly gameHistoryService: GameHistoryService,
    private readonly gameRepository: GameRepository,
    private readonly userStateRepository: UserStateRepository,
    private readonly gameRatingService: GameRatingService,
  ) {}

  @WebSocketServer()
  server: Server;

  START_TIME_MS = 5000;

  @SubscribeMessage('ready')
  handleReady(@ConnectedSocket() client: Socket) {
    const targetGame: Game = this.gameRepository.findBySocket(client.id);
    if (!targetGame) return;
    if (client.id === targetGame.gameInfo.leftUser.userSocket) targetGame.connectInfo.isLeftReady = true;
    else targetGame.connectInfo.isRightReady = true;
  }

  leaveGameRoom(game: Game) {
    this.server.to(game.gameInfo.leftUser.userSocket).socketsLeave(game.gameInfo.roomId.toString());
    this.server.to(game.gameInfo.rightUser.userSocket).socketsLeave(game.gameInfo.roomId.toString());
    this.gameRepository.delete(game.gameInfo.roomId);
    this.userStateRepository.update(game.gameInfo.leftUser.userId, UserState.IDLE);
    this.userStateRepository.update(game.gameInfo.rightUser.userId, UserState.IDLE);
  }

  makeGameWalkOver(game: Game) {
    const isLeftReady: boolean = game.connectInfo.isLeftReady;

    game.connectInfo.gameStatus = GameStatus.GAME_END;
    game.scoreInfo.leftScore = isLeftReady ? defaultSetting.matchPoint : 0;
    game.scoreInfo.rightScore = isLeftReady ? 0 : defaultSetting.matchPoint;
    game.resultInfo.win = isLeftReady ? game.gameInfo.leftUser : game.gameInfo.rightUser;
    game.resultInfo.defeat = isLeftReady ? game.gameInfo.rightUser : game.gameInfo.leftUser;
  }

  async checkGameReady(game: Game): Promise<void> {
    while (game.connectInfo.expiredTimeMs > new Date().getTime()) {
      if (game.connectInfo.isLeftReady && game.connectInfo.isRightReady) {
        game.connectInfo.gameStatus = GameStatus.GAME_READY;
        return;
      }
      await new Promise(f => setTimeout(f, 500));
    }
    game.connectInfo.gameStatus =
      !game.connectInfo.isLeftReady && !game.connectInfo.isRightReady ? GameStatus.UNAVAILABLE : GameStatus.GAME_END;
  }

  async waitForGamePlayers(game: Game) {
    await this.checkGameReady(game);
    switch (game.connectInfo.gameStatus) {
      case GameStatus.GAME_READY:
        this.startGame(game);
        break;
      case GameStatus.GAME_END:
        this.makeGameWalkOver(game);
        await this.repeatGameLoop(game);
        break;
      case GameStatus.UNAVAILABLE:
        this.server.to(game.gameInfo.roomId.toString()).emit('game-error');
        this.leaveGameRoom(game);
        break;
    }
  }

  startGame(game: Game) {
    this.server
      .to(game.gameInfo.roomId.toString())
      .emit('start', { startTimeMs: new Date().getTime() + this.START_TIME_MS });
    setTimeout(() => {
      game.connectInfo.gameStatus = GameStatus.IN_GAME;
      game.connectInfo.gameLoopId = setInterval(this.repeatGameLoop.bind(this), 10, game);
    }, this.START_TIME_MS);
  }

  async repeatGameLoop(game: Game) {
    this.moveBall(game);
    this.changeBallVector(game);
    if (this.checkWallCollision(game)) {
      game.renderInfo = new RenderInfo(game.gameInfo.backgroundColor);
      if (game.connectInfo.gameStatus === GameStatus.IN_GAME)
        this.server.to(game.gameInfo.roomId.toString()).emit('init', new EmitInit(game));
    }
    if (game.connectInfo.gameStatus === GameStatus.GAME_END) {
      clearInterval(game.connectInfo.gameLoopId);
      await this.gameRatingService.updateGameRating(game);
      const finishData: EmitFinish = new EmitFinish(await this.gameHistoryService.updateGameHistory(game));
      this.server.to(game.gameInfo.roomId.toString()).emit('finish', finishData);
      this.leaveGameRoom(game);
    } else {
      this.server.to(game.gameInfo.roomId.toString()).emit('render', game.renderInfo);
    }
  }

  moveBall(game: Game) {
    game.renderInfo.ball.x += defaultSetting.ballSpeed * game.renderInfo.ball.dx;
    game.renderInfo.ball.y += defaultSetting.ballSpeed * game.renderInfo.ball.dy;
  }

  // 공이 천장 내지는 패들에 부딫혔을때 -> 공의 벡터를 바꿈;
  changeBallVector(game: Game) {
    const ball: Ball = game.renderInfo.ball;
    const leftPaddle: Paddle = game.renderInfo.leftPaddle;
    const rightPaddle: Paddle = game.renderInfo.rightPaddle;

    // 천장에 부딪혔을때;
    if (ball.y <= 0 + defaultSetting.ballRad) ball.dy *= -1;
    if (ball.y >= defaultSetting.gameHeight - defaultSetting.ballRad) ball.dy *= -1;
    // player paddle에 부딪혔을때;
    if (ball.x <= leftPaddle.x + leftPaddle.width + defaultSetting.ballRad) {
      if (ball.y > leftPaddle.y && ball.y < leftPaddle.y + leftPaddle.height) {
        ball.x = leftPaddle.x + leftPaddle.width + defaultSetting.ballRad; // 공이 꼈을때;
        ball.dx *= -1;
      }
    }
    if (ball.x >= rightPaddle.x - defaultSetting.ballRad) {
      if (ball.y > rightPaddle.y && ball.y < rightPaddle.y + rightPaddle.height) {
        ball.x = rightPaddle.x - defaultSetting.ballRad; // 공이 꼈을때;
        ball.dx *= -1;
      }
    }
    return;
  }

  // 벽 충돌 판정 -> 스코어 업데이트
  checkWallCollision(game: Game): boolean {
    if (game.renderInfo.ball.x >= defaultSetting.gameWidth) {
      this.updateGameUserScore(game, true);
      return true;
    }
    if (game.renderInfo.ball.x <= 0) {
      this.updateGameUserScore(game, false);
      return true;
    }
    return false;
  }

  updateGameUserScore(game: Game, isLeftScored: boolean) {
    if (isLeftScored) {
      game.scoreInfo.leftScore++;
      if (game.scoreInfo.leftScore === defaultSetting.matchPoint) {
        game.connectInfo.gameStatus = GameStatus.GAME_END;
        game.resultInfo.win = game.gameInfo.leftUser;
        game.resultInfo.defeat = game.gameInfo.rightUser;
      }
    } else {
      game.scoreInfo.rightScore++;
      if (game.scoreInfo.rightScore === defaultSetting.matchPoint) {
        game.connectInfo.gameStatus = GameStatus.GAME_END;
        game.resultInfo.win = game.gameInfo.rightUser;
        game.resultInfo.defeat = game.gameInfo.leftUser;
      }
    }
  }

  findUserPaddle(userSocket: Socket, game: Game): Paddle | null {
    if (game.gameInfo.leftUser.userSocket === userSocket.id) return game.renderInfo.leftPaddle;
    else if (game.gameInfo.rightUser.userSocket === userSocket.id) return game.renderInfo.rightPaddle;
    else return null;
  }

  @SubscribeMessage('arrowUp')
  handleKeyPressUp(@ConnectedSocket() client: Socket) {
    const game = this.gameRepository.findBySocket(client.id);
    if (game.connectInfo.gameStatus !== GameStatus.IN_GAME) return;
    const userPaddle = this.findUserPaddle(client, game);
    if (userPaddle == null) return; // invalid;
    if (userPaddle.y > 0) userPaddle.y -= defaultSetting.paddleSpeed;
  }

  @SubscribeMessage('arrowDown')
  handleKeyPressDown(@ConnectedSocket() client: Socket) {
    const game = this.gameRepository.findBySocket(client.id);
    if (game.connectInfo.gameStatus !== GameStatus.IN_GAME) return;
    const userPaddle = this.findUserPaddle(client, game);
    if (userPaddle == null) return; // invalid;
    if (userPaddle.y < defaultSetting.gameHeight - userPaddle.height) userPaddle.y += defaultSetting.paddleSpeed;
  }
}
