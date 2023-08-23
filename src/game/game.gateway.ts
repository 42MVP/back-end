import { ConnectedSocket, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { Ball, EmitInit, Game, GameResult, GameSetting, Paddle, RenderInfo, defaultSetting } from './game';
import { GameRepository } from 'src/repository/game.repository';

@WebSocketGateway()
export class GameGateway {
  constructor(private readonly gameService: GameService, private readonly gameRepository: GameRepository) {}

  @WebSocketServer()
  server: Server;

  setting: GameSetting = defaultSetting;

  repeatGameLoop(game: Game) {
    this.moveBall(game);
    this.changeBallVector(game);
    if (this.checkWallCollision(game)) {
      game.renderInfo = new RenderInfo();
      this.server.to(game.gameInfo.roomId.toString()).emit('init', new EmitInit(game));
    }
    if (game.isGameEnd) {
      clearInterval(game.gameLoopId); // out of gameLoop -> Exit
      this.gameService.updateGameHistory(new GameResult(game));
      this.server.to(game.gameInfo.roomId.toString()).emit('finish', game.gameInfo);
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
      if (game.scoreInfo.leftScore === this.setting.matchPoint) game.isGameEnd = true;
    } else {
      game.scoreInfo.rightScore++;
      if (game.scoreInfo.rightScore === this.setting.matchPoint) game.isGameEnd = true;
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
