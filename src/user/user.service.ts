import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { Repository, UpdateResult } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(user: User): Promise<void> {
    await this.usersRepository.save(user);
  }

  async findOneByIntraId(intraId: string): Promise<User> {
    const user = await this.usersRepository.findOne({
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
    const user = await this.usersRepository.findOne({
      where: {
        id: id,
      },
    });
    if (!user) {
      throw new NotFoundException('해당 유저가 존재하지 않습니다!');
    }
    return user;
  }

  async updateRefreshToken(id: number, refreshToken: string): Promise<void> {
    const result: UpdateResult = await this.usersRepository.update(
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
    const result: UpdateResult = await this.usersRepository
      .update(
        {
          id: id,
        },
        {
          userName: updateUserDto.userName,
          avatar: updateUserDto.avatar,
          isAuth: updateUserDto.isAuth,
        },
      )
      .catch(e => {
        throw new BadRequestException('중복된 닉네임 입니다!');
      });
    if (result.affected == 0) {
      throw new NotFoundException('해당 유저가 존재하지 않습니다!');
    }
  }
}
