interface Game {
  gameInfo: GameInfo;
  scoreInfo: ScoreInfo;
  renderInfo: RenderInfo;
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

interface RenderInfo {
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
