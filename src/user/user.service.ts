import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { DataSource, EntityManager, Repository, Transaction, UpdateResult } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(user: User) {
    await this.usersRepository.save(user);
  }

  async findOneByIntraId(intraId: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: {
        intraId: intraId,
      },
    });
    return user;
  }

  async findOneById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: {
        id: id,
      },
    });
    if (!user) {
      throw new NotFoundException();
    }
    return user;
  }

  async updateRefreshToken(intraId: string, refreshToken: string): Promise<void> {
    const user: User = await this.findOneByIntraId(intraId);
    user.refreshToken = refreshToken;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<void> {
    const result: UpdateResult = await this.usersRepository.update(
      {
        id: id,
      },
      {
        userName: updateUserDto.userName,
        avatar: updateUserDto.avatar,
      },
    );
    if (result.affected == 0) {
      throw new NotFoundException();
    }
  }
}
