import { Module } from '@nestjs/common';
import { BlockService } from './block.service';
import { BlockController } from './block.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/common/entities/user.entity';
import { Block } from 'src/common/entities/block.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Block])],
  controllers: [BlockController],
  providers: [BlockService],
})
export class BlockModule {}
