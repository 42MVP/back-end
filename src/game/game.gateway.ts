import { ConnectedSocket, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { Ball, EmitFinish, EmitInit, Game, GameSetting, Paddle, RenderInfo, defaultSetting } from './game';
import { GameRepository } from 'src/repository/game.repository';
import { clearInterval } from 'timers';

@WebSocketGateway()
export class GameGateway {
  constructor(private readonly gameService: GameService, private readonly gameRepository: GameRepository) {}

  @WebSocketServer()
  server: Server;

  setting: GameSetting = defaultSetting;
  START_TIME_MS = 5000;

  @SubscribeMessage('ready')
  handleReady(@ConnectedSocket() client: Socket) {
    const targetGame: Game = this.gameRepository.findBySocket(client.id);
    if (!targetGame) return;
    if (client.id === targetGame.gameInfo.leftUser.userSocket) targetGame.connectInfo.isLeftReady = true;
    else targetGame.connectInfo.isRightReady = true;
  }

  sendErrorAndDestroyGame(game: Game): void {
    this.server.to(game.gameInfo.roomId.toString()).emit('game-error');
    this.server.to(game.gameInfo.leftUser.userSocket).socketsLeave(game.gameInfo.roomId.toString());
    this.server.to(game.gameInfo.rightUser.userSocket).socketsLeave(game.gameInfo.roomId.toString());
    this.gameRepository.delete(game.gameInfo.roomId);
  }

  makeGameWalkOver(game: Game, isLeftReady: boolean) {
    game.connectInfo.isGameEnd = true;
    game.scoreInfo.leftScore = isLeftReady ? this.setting.matchPoint : 0;
    game.scoreInfo.rightScore = isLeftReady ? 0 : this.setting.matchPoint;
    game.resultInfo.win = isLeftReady ? game.gameInfo.leftUser : game.gameInfo.rightUser;
    game.resultInfo.defeat = isLeftReady ? game.gameInfo.rightUser : game.gameInfo.leftUser;
  }

  async isGameReady(game: Game): Promise<boolean> {
    while (game.connectInfo.expiredTimeMs < new Date().getTime()) {
      if (game.connectInfo.isLeftReady && game.connectInfo.isRightReady) {
        return true;
      }
      await new Promise(f => setTimeout(f, 500));
    }
    return false;
  }

  async waitForGamePlayers(game: Game) {
    if (await this.isGameReady(game)) {
      this.startGame(game);
    } else {
      if (!game.connectInfo.isLeftReady && !game.connectInfo.isRightReady) {
        this.sendErrorAndDestroyGame(game);
      } else {
        if (game.connectInfo.isLeftReady) this.makeGameWalkOver(game, true);
        else this.makeGameWalkOver(game, false);
        await this.repeatGameLoop(game);
      }
    }
  }

  startGame(game: Game) {
    this.server
      .to(game.gameInfo.roomId.toString())
      .emit('start', { startTimeMs: new Date().getTime() + this.START_TIME_MS });
    setTimeout(() => {
      game.connectInfo.gameLoopId = setInterval(this.repeatGameLoop.bind(this), 10, game);
    }, this.START_TIME_MS);
  }

  async repeatGameLoop(game: Game) {
    this.moveBall(game);
    this.changeBallVector(game);
    if (this.checkWallCollision(game)) {
      game.renderInfo = new RenderInfo();
      if (!game.connectInfo.isGameEnd) this.server.to(game.gameInfo.roomId.toString()).emit('init', new EmitInit(game));
    }
    if (game.connectInfo.isGameEnd) {
      clearInterval(game.connectInfo.gameLoopId); // out of gameLoop -> Exit
      const finishData: EmitFinish = new EmitFinish(await this.gameService.updateGameHistory(game));
      this.server.to(game.gameInfo.roomId.toString()).emit('finish', finishData);
      this.server.to(game.gameInfo.leftUser.userSocket).socketsLeave(game.gameInfo.roomId.toString());
      this.server.to(game.gameInfo.rightUser.userSocket).socketsLeave(game.gameInfo.roomId.toString());
      this.gameRepository.delete(game.gameInfo.roomId);
    } else {
      this.server.to(game.gameInfo.roomId.toString()).emit('render', game.renderInfo);
    }
  }

  moveBall(game: Game) {
    game.renderInfo.ball.x += this.setting.ballSpeed * game.renderInfo.ball.dx;
    game.renderInfo.ball.y += this.setting.ballSpeed * game.renderInfo.ball.dy;
  }

  // 공이 천장 내지는 패들에 부딫혔을때 -> 공의 벡터를 바꿈;
  changeBallVector(game: Game) {
    const ball: Ball = game.renderInfo.ball;
    const leftPaddle: Paddle = game.renderInfo.leftPaddle;
    const rightPaddle: Paddle = game.renderInfo.rightPaddle;

    // 천장에 부딪혔을때;
    if (ball.y <= 0 + this.setting.ballRad) ball.dy *= -1;
    if (ball.y >= this.setting.gameHeight - this.setting.ballRad) ball.dy *= -1;
    // player paddle에 부딪혔을때;
    if (ball.x <= leftPaddle.x + leftPaddle.width + this.setting.ballRad) {
      if (ball.y > leftPaddle.y && ball.y < leftPaddle.y + leftPaddle.height) {
        ball.x = leftPaddle.x + leftPaddle.width + this.setting.ballRad; // 공이 꼈을때;
        ball.dx *= -1;
      }
    }
    if (ball.x >= rightPaddle.x - this.setting.ballRad) {
      if (ball.y > rightPaddle.y && ball.y < rightPaddle.y + rightPaddle.height) {
        ball.x = rightPaddle.x - this.setting.ballRad; // 공이 꼈을때;
        ball.dx *= -1;
      }
    }
    return;
  }

  // 벽 충돌 판정 -> 스코어 업데이트
  checkWallCollision(game: Game): boolean {
    if (game.renderInfo.ball.x >= this.setting.gameWidth) {
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
      if (game.scoreInfo.leftScore === this.setting.matchPoint) {
        game.connectInfo.isGameEnd = true;
        game.resultInfo.win = game.gameInfo.leftUser;
        game.resultInfo.defeat = game.gameInfo.rightUser;
      }
    } else {
      game.scoreInfo.rightScore++;
      if (game.scoreInfo.rightScore === this.setting.matchPoint) {
        game.connectInfo.isGameEnd = true;
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
    const userPaddle = this.findUserPaddle(client, game);
    if (userPaddle == null) return; // invalid;
    if (userPaddle.y > 0) userPaddle.y -= this.setting.paddleSpeed;
  }

  @SubscribeMessage('arrowDown')
  handleKeyPressDown(@ConnectedSocket() client: Socket) {
    const game = this.gameRepository.findBySocket(client.id);
    const userPaddle = this.findUserPaddle(client, game);
    if (userPaddle == null) return; // invalid;
    if (userPaddle.y < this.setting.gameHeight - userPaddle.height) userPaddle.y += this.setting.paddleSpeed;
  }
}
