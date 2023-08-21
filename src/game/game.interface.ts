export class Game {
  gameInfo: GameInfo;
  scoreInfo: ScoreInfo;
  renderInfo: RenderInfo;

  constructor(user1: GameUser, user2: GameUser) {
    this.gameInfo = {
      roomId: 0,
      leftUser: {
        userId: user1.userId,
        userName: user1.userName,
        userSocket: user1.userSocket,
      },
      rightUser: {
        userId: user2.userId,
        userName: user2.userName,
        userSocket: user2.userSocket,
      },
      backgroundColor: 'black',
    };
    this.scoreInfo = {
      leftScore: 0,
      rightScore: 0,
    };
    this.renderInfo = {
      leftPaddle: {
        width: 0,
        height: 0,
        x: 0,
        y: 0,
      },
      rightPaddle: {
        width: 0,
        height: 0,
        x: 0,
        y: 0,
      },
      ball: {
        x: 0,
        y: 0,
        dx: 0,
        dy: 0,
      },
    };
  }
}

interface GameInfo {
  roomId: number;
  leftUser: GameUser;
  rightUser: GameUser;
  backgroundColor: string;
}

interface GameUser {
  userId: number;
  userName: string;
  userSocket: string;
}

interface ScoreInfo {
  leftScore: number;
  rightScore: number;
}

export interface RenderInfo {
  leftPaddle: Paddle;
  rightPaddle: Paddle;
  ball: Ball;
}

interface Paddle {
  width: number;
  height: number;
  x: number;
  y: number;
}

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

interface GameSetting {
  ballRad: number;
  paddleSpeed: number;
  gameWidth: number;
  gameHeight: number;
  matchPoint: number;
}

interface GameResult {
  winId: number;
  defeatId: number;
  winScore: number;
  defeatScore: number;
}
