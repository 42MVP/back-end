import { Injectable } from '@nestjs/common';

type compositeKey = string;
type muteTime = Date;

@Injectable()
export class MuteTimeRepository {
  private readonly muteTimeMap: Map<compositeKey, muteTime> = new Map<compositeKey, muteTime>();

  makeCompositeKey(roomId: number, userId: number) {
    return roomId.toString().concat(',', userId.toString());
  }

  find(roomId: number, userId: number): muteTime | undefined {
    return this.muteTimeMap.get(this.makeCompositeKey(roomId, userId));
  }

  save(roomId: number, userId: number, muteTime: muteTime): void {
    this.muteTimeMap.set(this.makeCompositeKey(roomId, userId), muteTime);
  }

  update(roomId: number, userId: number, muteTime: muteTime): boolean {
    const targetKey: compositeKey = this.makeCompositeKey(roomId, userId);
    if (this.muteTimeMap.get(targetKey) === undefined) {
      return false;
    } else {
      this.muteTimeMap.set(targetKey, muteTime);
      return true;
    }
  }

  delete(roomId: number, userId: number): boolean {
    return this.muteTimeMap.delete(this.makeCompositeKey(roomId, userId));
  }
}
