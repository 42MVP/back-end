import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/common/entities/user.entity';
import { MatchingRepository } from 'src/repository/matching.repository';
import { QueueRepository } from 'src/repository/queue.repository';
import { Repository } from 'typeorm';
import { GameMatchingGateway } from './game-matching.gateway';

@Injectable()
export class GameMatchingService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly queueRepository: QueueRepository,
    private readonly matchingRepository: MatchingRepository,
    private readonly gameMatchingGateway: GameMatchingGateway,
  ) {}

  cancelQueue(userId: number): Promise<void> {
    this.queueRepository.delete(userId);
    return;
  }

  async applyQueue(userId: number): Promise<void> {
    const user: User = await this.userRepository.findOne({ where: { id: userId } });
    if (user === null) throw new NotFoundException('찾을 수 없는 유저심');

    if (this.queueRepository.find(user.id) !== undefined) {
      throw new ConflictException('이미 큐 잡는 중이심');
    }

    this.queueRepository.save([user.id, user.rating]);
    return;
  }

  async invite(inviterId: number, inviteeId: number): Promise<void> {
    // TODO: invitee 겜중일 때도 초대 불가
    if (this.queueRepository.find(inviteeId) !== undefined) {
      throw new ConflictException('초대 불가눙');
    }
    // TODO: inviter 겜중일 때도 초대 불가
    if (this.queueRepository.find(inviterId) !== undefined) {
      throw new ConflictException('님 큐잡는중임');
    }

    const matchingId = this.matchingRepository.save([inviterId, inviteeId]);
    const isSened = this.gameMatchingGateway.sendInvite(inviteeId, matchingId);
    if (isSened === false) {
      this.matchingRepository.delete(matchingId);
      this.gameMatchingGateway.sendMatchingError(matchingId);
    }
    return;
  }
}
