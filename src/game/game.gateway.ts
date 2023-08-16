import { Inject } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';

// 5선 게임 -> 5점 이길때 1승;

@WebSocketGateway()
export class GameGateway {
  constructor(
    @Inject()
    private readonly gameService: GameService,
  ) {}
  @WebSocketServer()
  server: Server;

  setting: GameSetting = {
    ballRad: 12.5,
    paddleSpeed: 50,
    gameWidth: 800,
    gameHeight: 600,
  };

  findUserPaddle(userSocket: Socket, game: Game): Paddle | null {
    if (game.gameInfo.leftUser.userSocket === userSocket.id) return game.gameInfo.leftUser.paddle;
    else if (game.gameInfo.rightUser.userSocket === userSocket.id) return game.gameInfo.rightUser.paddle;
    else return null;
  }

  isGameEnd(game: Game): boolean {
    if (game.gameInfo.leftUser.score === 5 || game.gameInfo.rightUser.score === 5) {
      return true;
    } else {
      return false;
    }
  }

  createGameResult(game: Game): GameResult {
    let winUser: GameUser;
    let defeatUser: GameUser;
    if (game.gameInfo.leftUser.score === 5) {
      winUser = game.gameInfo.leftUser;
      defeatUser = game.gameInfo.rightUser;
    } else {
      winUser = game.gameInfo.rightUser;
      defeatUser = game.gameInfo.leftUser;
    }
    const result: GameResult = {
      winId: winUser.userId,
      defeatId: defeatUser.userId,
      winValue: winUser.score,
      defeatValue: defeatUser.score,
    };
    return result;
  }

  // 공이 천장 내지는 패들에 부딫혔을때 -> 공의 벡터를 바꿈;
  changeBallVector(game: Game) {
    const ball: Ball = game.gameInfo.ball;
    const leftPaddle: Paddle = game.gameInfo.leftUser.paddle;
    const rightPaddle: Paddle = game.gameInfo.rightUser.paddle;
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
    if (game.gameInfo.ball.x <= 0) {
      game.gameInfo.rightUser.score++;
      return true;
    }
    if (game.gameInfo.ball.x >= this.setting.gameWidth) {
      game.gameInfo.leftUser.score++;
      return true;
    }
    return false;
  }

  resetGame(game: Game) {
    // 공 위치 reset;
    game.gameInfo.ball.x = this.setting.gameWidth / 2;
    game.gameInfo.ball.y = this.setting.gameHeight / 2;
    if (Math.round(Math.random()) === 1) game.gameInfo.ball.dx = -1;
    else game.gameInfo.ball.dx = 1;
    if (Math.round(Math.random()) === 1) game.gameInfo.ball.dy = -1;
    else game.gameInfo.ball.dy = 1;
    // paddle 위치 reset;
    game.gameInfo.leftUser.paddle.x = 0;
    game.gameInfo.leftUser.paddle.y = this.setting.gameHeight / 2;
    game.gameInfo.rightUser.paddle.x = this.setting.gameWidth - game.gameInfo.rightUser.paddle.width;
    game.gameInfo.rightUser.paddle.y = this.setting.gameHeight / 2;
  }

  // game 객체를 요청할때
  @SubscribeMessage('ping')
  handleGameInfo(@ConnectedSocket() client: Socket) {
    let game: Game; // 임시 변수
    // 실제 in-memory에서 찾아서 가져옴;
    // const game: Game = this.gameRepository.find(client.rooms.toInt());
    this.changeBallVector(game);
    if (this.checkWallCollision(game)) {
      this.resetGame(game);
    }
    // 데이터 송신
    if (this.isGameEnd) {
      // 만약 게임이 끝나야 한다면
      const result: GameResult = this.createGameResult(game);
      this.gameService.updateGameHistory(result);
      this.server.to(game.roomId.toString()).emit('finish', game.gameInfo);
    } else {
      // 5점이 아직 안났으면
      this.server.to(game.roomId.toString()).emit('pong', game.gameInfo);
    }
  }

  // key 입력을 받았을때 내부 정보를 업데이트
  @SubscribeMessage('keyUp')
  handleKeyPresssUp(@ConnectedSocket() client: Socket) {
    let game: Game; // 임시 변수
    // 실제 in-memory에서 찾아서 가져옴;
    // const game: Game = this.gameRepository.find(client.rooms.toInt());
    // game object update;
    const userPaddle = this.findUserPaddle(client, game);
    if (userPaddle == null) return; // invalid;
    // 패들 위치만 변경;
    if (userPaddle.y > 0) userPaddle.y -= this.setting.paddleSpeed;
  }

  @SubscribeMessage('keyDown')
  handleKeyPresssDown(@ConnectedSocket() client: Socket) {
    let game: Game; // 임시 변수
    // 실제 in-memory에서 찾아서 가져옴;
    // const game: Game = this.gameRepository.find(client.rooms.toInt());
    // game object update;
    const userPaddle = this.findUserPaddle(client, game);
    if (userPaddle == null) return; // invalid;
    // 패들 위치만 변경;
    if (userPaddle.y > 0) userPaddle.y -= this.setting.paddleSpeed;
  }
}
