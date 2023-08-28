import { User } from 'src/common/entities/user.entity';

export const defaultSetting: GameSetting = {
  gameWidth: 1100,
  gameHeight: 700,
  matchPoint: 5,
  paddleWidth: 20,
  paddleHeight: 100,
  paddleSpeed: 50,
  ballRad: 12.5,
  ballSpeed: 1,
};

const defaultBackground = {
  gameModeOne: 'black',
  gameModeTwo: 'pink',
};

export class Game {
  gameLoopId: ReturnType<typeof setInterval>;
  isGameEnd: boolean;
  gameInfo: GameInfo;
  scoreInfo: ScoreInfo;
  renderInfo: RenderInfo;
  resultInfo: ResultInfo;

  constructor(user1: GameUser, user2: GameUser) {
    this.isGameEnd = false;
    this.gameInfo = {
      roomId: 0,
      leftUser: user1,
      rightUser: user2,
      backgroundColor: defaultBackground.gameModeOne,
    };
    this.scoreInfo = new ScoreInfo();
    this.renderInfo = new RenderInfo();
    this.resultInfo = new ResultInfo();
  }
}

export class ResultInfo {
  win: GameUser | null;
  defeat: GameUser | null;

  constructor() {
    this.win = null;
    this.defeat = null;
  }
}

export interface GameInfo {
  roomId: number;
  leftUser: GameUser;
  rightUser: GameUser;
  backgroundColor: string;
}

export class GameUser {
  userId: number;
  userName: string;
  userSocket: string;
  avatarUrl: string;
  rating: number;

  constructor(user: User, socketId: string) {
    this.userId = user.id;
    this.userName = user.userName;
    this.userSocket = socketId;
    this.avatarUrl = user.avatar;
    this.rating = user.rating;
  }
}

export class GameUserData {
  name: string;
  avatarURL: string;
  rating: number;

  constructor(gameUser: GameUser) {
    this.name = gameUser.userName;
    this.avatarURL = gameUser.avatarUrl;
    this.rating = gameUser.rating;
  }
}

export class ScoreInfo {
  leftScore: number;
  rightScore: number;

  constructor() {
    this.leftScore = 0;
    this.rightScore = 0;
  }
}

export class RenderInfo {
  leftPaddle: Paddle;
  rightPaddle: Paddle;
  ball: Ball;

  constructor() {
    this.leftPaddle = new Paddle(true);
    this.rightPaddle = new Paddle(false);
    this.ball = new Ball();
  }
}

export class Paddle {
  width: number;
  height: number;
  x: number;
  y: number;

  constructor(isLeft: boolean) {
    this.width = defaultSetting.paddleWidth;
    this.height = defaultSetting.paddleHeight;
    if (isLeft) {
      this.x = 0;
    } else {
      this.x = defaultSetting.gameWidth - defaultSetting.paddleWidth;
    }
    this.y = (defaultSetting.gameHeight - defaultSetting.paddleHeight) / 2;
  }
}

export class Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;

  constructor() {
    this.dx = Math.round(Math.random()) ? 1 : -1;
    this.dy = Math.round(Math.random()) ? 1 : -1;
    this.x = defaultSetting.gameWidth / 2;
    this.y = defaultSetting.gameHeight / 2;
  }
}

export interface GameSetting {
  gameWidth: number;
  gameHeight: number;
  matchPoint: number;
  paddleWidth: number;
  paddleHeight: number;
  paddleSpeed: number;
  ballRad: number;
  ballSpeed: number;
}

export interface EmitMatched {
  matchingId: number;
  endTimeMs: number;
}

export class EmitConfirm {
  result: boolean;
  leftUser: GameUserData | undefined;
  rightUser: GameUserData | undefined;
  gameRoomId: string | undefined;

  constructor(game: Game | null) {
    if (game) {
      this.result = true;
      this.leftUser = new GameUserData(game.gameInfo.leftUser);
      this.rightUser = new GameUserData(game.gameInfo.rightUser);
      this.gameRoomId = game.gameInfo.roomId.toString();
    } else {
      this.result = false;
      this.leftUser = undefined;
      this.rightUser = undefined;
      this.gameRoomId = undefined;
    }
  }
}

export class EmitInit {
  background: string;
  leftScore: number;
  rightScore: number;
  tableInfo: RenderInfo;

  constructor(game: Game) {
    this.background = game.gameInfo.backgroundColor;
    this.leftScore = game.scoreInfo.leftScore;
    this.rightScore = game.scoreInfo.rightScore;
    this.tableInfo = game.renderInfo;
  }
}

export interface EmitInviteError {
  msg: string;
}

export interface EmitInvite {
  inviterName: string;
  inviterAvatarUrl: string;
  invitationId: number;
}

export class EmitInviteConfirm {
  result: boolean;
  leftUser: GameUserData | undefined;
  rightUser: GameUserData | undefined;
  gameRoomId: string | undefined;

  constructor(game: Game | null) {
    if (game) {
      this.result = true;
      this.leftUser = new GameUserData(game.gameInfo.leftUser);
      this.rightUser = new GameUserData(game.gameInfo.rightUser);
      this.gameRoomId = game.gameInfo.roomId.toString();
    } else {
      this.result = false;
      this.leftUser = undefined;
      this.rightUser = undefined;
      this.gameRoomId = undefined;
    }
  }
}

export class EmitFinish {
  gameHistoryId: number;

  constructor(gameHistoryId: number) {
    this.gameHistoryId = gameHistoryId;
  }
}
