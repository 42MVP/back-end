type Game = {
  roomId: number;
  gameInfo: GameInfo;
};

type GameInfo = {
  backgroundColor: string;
  leftUser: GameUser;
  rightUser: GameUser;
  ball: Ball;
};

type GameUser = {
  userId: number;
  userSocket: string;
  paddle: Paddle;
  score: number;
};

type Paddle = {
  width: number;
  height: number;
  x: number;
  y: number;
};

type Ball = {
  x: number;
  y: number;
  dx: number;
  dy: number;
};

type GameSetting = {
  ballRad: number;
  paddleSpeed: number;
  gameWidth: number;
  gameHeight: number;
};

type GameResult = {
  winId: number;
  defeatId: number;
  winValue: number;
  defeatValue: number;
};
