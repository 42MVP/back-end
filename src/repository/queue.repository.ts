import { Injectable } from '@nestjs/common';

export type rating = number;
export type userId = number;

@Injectable()
export class QueueRepository {
  private readonly queueMap: Map<userId, rating> = new Map<rating, userId>();

  find(userId: userId): rating | undefined {
    return this.queueMap.get(userId);
  }

  findAll(): Map<userId, rating> {
    return this.queueMap;
  }

  save(element: Record<userId, rating>): void {
    this.queueMap.set(element[0], element[1]);
    return;
  }

  delete(userId: userId): boolean {
    return this.queueMap.delete(userId);
  }
}
