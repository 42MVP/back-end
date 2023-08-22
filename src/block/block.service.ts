import { Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Block } from '../common/entities/block.entity';
import { User } from '../common/entities/user.entity';
import { UserService } from '../user/user.service';
import { DeleteResult, Repository } from 'typeorm';

@Injectable()
export class BlockService {
  constructor(
    @InjectRepository(Block)
    private blockRepository: Repository<Block>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private userService: UserService,
  ) {}

  async getBlockList(id: number): Promise<User[]> {
    return await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect(Block, 'block', 'block.to_id = user.id')
      .where('block.from_id = :user_id', { user_id: id })
      .getMany();
  }

  async addBlockList(from: number, to: number): Promise<void> {
    const toUser = await this.userService.findOneById(to);
    if (!toUser) {
      throw new NotFoundException('차단 할 유저가 존재하지 않습니다!');
    }
    await this.blockRepository.save(new Block(from, to));
  }

  async removeBlockList(from: number, to: number): Promise<void> {
    const result: DeleteResult = await this.blockRepository.delete({ fromId: from, toId: to });
    if (result.affected == 0) {
      throw new NotFoundException('해당 유저를 차단하고 있지 않습니다!');
    }
  }

  async isBlock(id: number, target: number): Promise<boolean> {
    let result = false;

    (await this.getBlockList(id)).forEach(user => {
      if (user.id == target) {
        result = true;
        return;
      }
    });

    return result;
  }
}
