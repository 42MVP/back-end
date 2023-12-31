import { Module, forwardRef } from '@nestjs/common';
import { BlockService } from './block.service';
import { BlockController } from './block.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../common/entities/user.entity';
import { Block } from '../common/entities/block.entity';
import { UserModule } from '../user/user.module';
import { Friendship } from 'src/common/entities/friendship.entity';
import { RepositoryModule } from 'src/repository/repository.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Block, Friendship]), forwardRef(() => UserModule), RepositoryModule],
  controllers: [BlockController],
  providers: [BlockService],
  exports: [BlockService],
})
export class BlockModule {}
