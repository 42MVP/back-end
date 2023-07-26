import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../common/entities/user.entity';
import { DeleteResult, Repository } from 'typeorm';
import { Friendship } from '../common/entities/friendship.entity';
import { UserService } from '../user/user.service';

@Injectable()
export class FriendService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Friendship)
    private friendshipRepository: Repository<Friendship>,
    private userService: UserService,
  ) {}

  async getFriendsList(id: number): Promise<User[]> {
    // const friendships = await this.friendshipRepository.find({
    //   where: {
    //     fromId: id,
    //   },
    // });
    // return await this.userRepository.find({
    //   where: {
    //     id: In(friendships.map(friendship => friendship.toId)),
    //   },
    // });

    // return await this.userRepository
    //   .createQueryBuilder('user')
    //   .leftJoinAndSelect(Friendship, 'friendship', 'friendship.to_id = user.id')
    //   .where(subQuery => {
    //     const subQueryBuilder = subQuery
    //       .subQuery()
    //       .select('friendship.to_id')
    //       .from(Friendship, 'friendship')
    //       .where('friendship.from_id = :id', { id: 1 })
    //       .getQuery();

    //     return 'friendship.to_id IN ' + subQueryBuilder;
    //   })
    //   .getMany();

    return await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect(Friendship, 'friendship', 'friendship.to_id = user.id')
      .where('friendship.from_id = :user_id', { user_id: id })
      .getMany();
  }

  async addFriendList(from: number, to: number): Promise<void> {
    const toUser = await this.userService.findOneById(to);
    if (!toUser) {
      throw new NotFoundException('팔로우할 유저가 존재하지 않습니다!');
    }
    await this.friendshipRepository.save(new Friendship(from, to));
  }

  async removeFriendList(from: number, to: number): Promise<void> {
    const result: DeleteResult = await this.friendshipRepository.delete({ fromId: from, toId: to });
    if (result.affected == 0) {
      throw new NotFoundException('해당 유저를 팔로우하고 있지 않습니다!');
    }
  }
}
