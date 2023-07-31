import { Module } from '@nestjs/common';
import { FriendService } from './friend.service';
import { FriendController } from './friend.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friendship } from '../common/entities/friendship.entity';
import { User } from '../common/entities/user.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Friendship]), UserModule],
  controllers: [FriendController],
  providers: [FriendService],
})
export class FriendModule {}