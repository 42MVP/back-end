import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../common/entities/user.entity';
import { Repository, UpdateResult } from 'typeorm';
import { GameHistoryService } from '../game-history/game-history.service';
import { UserAchievementService } from '../user-achievement/user-achievement.service';
import { Achievement } from 'src/common/entities/achievement.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private gameHistoryService: GameHistoryService,
    private userAchievementService: UserAchievementService,
    @InjectRepository(Achievement)
    private achievementRespository: Repository<Achievement>,
  ) {}

  async create(user: User): Promise<User> {
    return await this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async findOneByIntraId(intraId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        intraId: intraId,
      },
    });
    if (!user) {
      throw new NotFoundException('해당 유저가 존재하지 않습니다!');
    }
    return user;
  }

  async findOneById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        id: id,
      },
      relations: { userAchievements: true },
    });
    if (!user) {
      throw new NotFoundException('해당 유저가 존재하지 않습니다!');
    }
    user.gameHistories = await this.gameHistoryService.getGameHistry(id);
    user.achievements = await this.userAchievementService.getAchievement(id);
    return user;
  }

  async findAllByUsername(username: string): Promise<User[]> {
    const userList: User[] = await this.userRepository
      .createQueryBuilder('user')
      .where('user_name like :name', { name: `${username}%` })
      .getMany();
    return userList;
  }

  async findOneByUsername(username: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        userName: username,
      },
    });
    if (!user) {
      throw new NotFoundException('해당 유저가 존재하지 않습니다!');
    }
    user.gameHistories = await this.gameHistoryService.getGameHistry(user.id);
    user.achievements = await this.userAchievementService.getAchievement(user.id);
    return user;
  }

  async updateRefreshToken(id: number, refreshToken: string): Promise<void> {
    const result: UpdateResult = await this.userRepository.update(
      {
        id: id,
      },
      {
        refreshToken: refreshToken,
      },
    );
    if (result.affected == 0) {
      throw new NotFoundException('해당 유저가 존재하지 않습니다!');
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<void> {
    const result: UpdateResult = await this.userRepository
      .update(
        {
          id: id,
        },
        {
          userName: updateUserDto.name,
          // avatar: updateUserDto.avatar,
          isAuth: updateUserDto.isAuth,
        },
      )
      .catch(() => {
        throw new ConflictException('중복된 닉네임 입니다!');
      });
    if (result.affected == 0) {
      throw new NotFoundException('해당 유저가 존재하지 않습니다!');
    }
  }
}
