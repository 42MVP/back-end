import { Injectable } from '@nestjs/common';

type userId = number;
type socketId = string;

// interface UserSocket {
//   userId: number;
//   socketId: string;
// }

@Injectable()
export class UserSocketRepository {
  private readonly UserSocketMap: Map<userId, socketId> = new Map<userId, socketId>();

  find(userId: userId): socketId | undefined {
    return this.UserSocketMap.get(userId);
  }

  save(userId: userId, socketId: socketId): void {
    this.UserSocketMap.set(userId, socketId);
    return;
  }

  update(userId: userId, socketId: socketId): boolean {
    if (this.UserSocketMap.get(userId) == undefined) {
      return false;
    } else {
      this.UserSocketMap.set(userId, socketId);
      return true;
    }
  }

  delete(userId: userId): boolean {
    return this.UserSocketMap.delete(userId);
  }
}
