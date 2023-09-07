import { Module, forwardRef } from '@nestjs/common';
import { FriendService } from './friend.service';
import { FriendController } from './friend.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friendship } from '../common/entities/friendship.entity';
import { User } from '../common/entities/user.entity';
import { UserModule } from '../user/user.module';
import { FriendGateway } from './friend.gateway';
import { RepositoryModule } from 'src/repository/repository.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Friendship]), forwardRef(() => UserModule), RepositoryModule],
  controllers: [FriendController],
  providers: [FriendService, FriendGateway],
  exports: [FriendService],
})
export class FriendModule {}
