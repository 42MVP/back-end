import { Module } from '@nestjs/common';
import { FriendService } from './friend.service';
import { FriendController } from './friend.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friendship } from 'src/common/entities/friendship.entity';
import { User } from 'src/common/entities/user.entity';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Friendship]), UserModule],
  controllers: [FriendController],
  providers: [FriendService],
})
export class FriendModule {}
