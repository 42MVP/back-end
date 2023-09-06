import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/common/entities/user.entity';
import { GameMode } from 'src/game/game';
import { QueueRepository } from 'src/repository/queue.repository';
import { UserState, UserStateRepository } from 'src/repository/user-state.repository';
import { Repository } from 'typeorm';

@Injectable()
export class GameMatchingService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly queueRepository: QueueRepository,
    private readonly userStateRepository: UserStateRepository,
  ) {}

  async applyQueue(userId: number, gameMode: GameMode): Promise<void> {
    const user: User = await this.userRepository.findOne({ where: { id: userId } });

    if (user === null) throw new NotFoundException('찾을 수 없는 유저심');
    const state: UserState | undefined = this.userStateRepository.find(userId);
    if (state === UserState.UNAVAIABLE || state === UserState.IN_QUEUE) return;
    else if (state !== UserState.IDLE) throw new BadRequestException('큐를 잡을 수 없음');
    this.queueRepository.save(gameMode, [user.id, user.rating]);
    this.userStateRepository.update(userId, UserState.IN_QUEUE);

    return;
  }

  cancelQueue(userId: number): Promise<void> {
    this.queueRepository.delete(userId);

    const state: UserState | undefined = this.userStateRepository.find(userId);
    if (state === UserState.UNAVAIABLE) return;
    if (state !== UserState.IN_QUEUE) throw new BadRequestException('큐 취소 실패');
    this.userStateRepository.update(userId, UserState.IDLE);

    return;
  }
}
