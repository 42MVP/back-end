import { Injectable } from '@nestjs/common';

type userId = number;
type muteTime = Date;

@Injectable()
export class MuteTimeRepository {
  private readonly muteTimeMap: Map<userId, muteTime> = new Map<userId, muteTime>();

  find(userId: userId): muteTime | undefined {
    return this.muteTimeMap.get(userId);
  }

  save(userId: userId, muteTime: muteTime): void {
    this.muteTimeMap.set(userId, muteTime);
  }

  update(userId: userId, muteTime: muteTime): boolean {
    if (this.muteTimeMap.get(userId) === undefined) {
      return false;
    } else {
      this.muteTimeMap.set(userId, muteTime);
      return true;
    }
  }

  delete(userId: userId): boolean {
    return this.muteTimeMap.delete(userId);
  }
}
