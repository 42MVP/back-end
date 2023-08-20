import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/common/entities/user.entity';
import { QueueRepository } from 'src/repository/queue.repository';
import { Repository } from 'typeorm';

@Injectable()
export class GameMatchingService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly queueRepository: QueueRepository,
  ) {}

  async applyQueue(userId: number): Promise<void> {
    const user: User = await this.userRepository.findOne({ where: { id: userId } });

    if (user === null) throw new NotFoundException('찾을 수 없는 유저심');
    // TODO: [게임, 큐, 매칭, 초대]중에는 큐를 잡을 수 없음
    if (this.queueRepository.find(user.id) !== undefined) {
      throw new ConflictException('이미 큐 잡는 중이심');
    }
    this.queueRepository.save([user.id, user.rating]);

    return;
  }

  cancelQueue(userId: number): Promise<void> {
    this.queueRepository.delete(userId);

    return;
  }
}
