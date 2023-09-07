import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatRoom } from '../common/entities/chatroom.entity';
import { User } from '../common/entities/user.entity';
import { ChatUser } from '../common/entities/chatuser.entity';
import { ChatGateway } from './chat.gateway';
import { RepositoryModule } from '../repository/repository.module';
import { Block } from 'src/common/entities/block.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatRoom, ChatUser, User, Block]), RepositoryModule],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
})
export class ChatModule {}
