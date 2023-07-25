import { Injectable } from '@nestjs/common';

type userId = number;
type socketId = string;

@Injectable()
export class UserSocketRepository {
  private readonly userSocketMap: Map<userId, socketId> = new Map<userId, socketId>();

  find(userId: userId): socketId | undefined {
    return this.userSocketMap.get(userId);
  }

  save(userId: userId, socketId: socketId): void {
    this.userSocketMap.set(userId, socketId);
    return;
  }

  update(userId: userId, socketId: socketId): boolean {
    if (this.userSocketMap.get(userId) == undefined) {
      return false;
    } else {
      this.userSocketMap.set(userId, socketId);
      return true;
    }
  }

  delete(userId: userId): boolean {
    return this.userSocketMap.delete(userId);
  }
}
