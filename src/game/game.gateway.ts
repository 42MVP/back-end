import { ConnectedSocket, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { Ball, Game, GameResult, GameSetting, Paddle } from './game';
import { GameRepository } from 'src/repository/game.repository';

@WebSocketGateway()
export class GameGateway {
  constructor(private readonly gameService: GameService, private readonly gameRepository: GameRepository) {}

  @WebSocketServer()
  server: Server;

  setting: GameSetting = {
    gameWidth: 1100,
    gameHeight: 700,
    matchPoint: 5,
    paddleWidth: 20,
    paddleHeight: 100,
    paddleSpeed: 50,
    ballRad: 12.5,
  };

  // send_all() -> callback function;
  sendRenderInfo(game: Game) {
    // 공 좌표 업데이트;
    game.renderInfo.ball.x += 1 * game.renderInfo.ball.dx;
    game.renderInfo.ball.y += 1 * game.renderInfo.ball.dy;
    this.changeBallVector(game);
    if (this.checkWallCollision(game)) {
      this.resetGame(game);
      this.server.to(game.gameInfo.roomId.toString()).emit('init', game.renderInfo);
    }
    // 데이터 송신
    if (this.isGameEnd(game)) {
      // 만약 게임이 끝나야 한다면
      const result: GameResult = this.createGameResult(game);
      this.gameService.updateGameHistory(result);
      this.server.to(game.gameInfo.roomId.toString()).emit('finish', game.gameInfo);
    } else {
      // 5점이 아직 안났으면
      this.server.to(game.gameInfo.roomId.toString()).emit('render', game.renderInfo);
    }
  }

  findUserPaddle(userSocket: Socket, game: Game): Paddle | null {
    if (game.gameInfo.leftUser.userSocket === userSocket.id) return game.renderInfo.leftPaddle;
    else if (game.gameInfo.rightUser.userSocket === userSocket.id) return game.renderInfo.rightPaddle;
    else return null;
  }

  isGameEnd(game: Game): boolean {
    if (game.scoreInfo.leftScore === this.setting.matchPoint || game.scoreInfo.rightScore === this.setting.matchPoint) {
      return true;
    } else {
      return false;
    }
  }

  createGameResult(game: Game): GameResult {
    const gameResult: GameResult = {} as GameResult;
    if (game.scoreInfo.leftScore === this.setting.matchPoint) {
      gameResult.winId = game.gameInfo.leftUser.userId;
      gameResult.winScore = game.scoreInfo.leftScore;
      gameResult.defeatId = game.gameInfo.rightUser.userId;
      gameResult.defeatScore = game.scoreInfo.rightScore;
    } else {
      gameResult.winId = game.gameInfo.rightUser.userId;
      gameResult.winScore = game.scoreInfo.rightScore;
      gameResult.defeatId = game.gameInfo.leftUser.userId;
      gameResult.defeatScore = game.scoreInfo.leftScore;
    }
    return gameResult;
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
    if (game.renderInfo.ball.x <= 0) {
      game.scoreInfo.rightScore++;
      return true;
    }
    if (game.renderInfo.ball.x >= this.setting.gameWidth) {
      game.scoreInfo.leftScore++;
      return true;
    }
    return false;
  }

  resetGame(game: Game) {
    // 공 위치 reset;
    game.renderInfo.ball.x = this.setting.gameWidth / 2;
    game.renderInfo.ball.y = this.setting.gameHeight / 2;
    if (Math.round(Math.random()) === 1) game.renderInfo.ball.dx = -1;
    else game.renderInfo.ball.dx = 1;
    if (Math.round(Math.random()) === 1) game.renderInfo.ball.dy = -1;
    else game.renderInfo.ball.dy = 1;
    // paddle 위치 reset;
    game.renderInfo.leftPaddle.x = 0;
    game.renderInfo.leftPaddle.y = this.setting.gameHeight / 2;
    game.renderInfo.rightPaddle.x = this.setting.gameWidth - game.renderInfo.rightPaddle.width;
    game.renderInfo.rightPaddle.y = this.setting.gameHeight / 2;
  }

  // key 입력을 받았을때 내부 정보를 업데이트
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
