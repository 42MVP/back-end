import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatRoom } from '../database/entities/chatroom.entity';
import { User } from '../database/entities/user.entity';
import { ChatUser } from '../database/entities/chatuser.entity';
import { ChatGateway } from './chat.gateway';
import { RepositoryModule } from '../repository/repository.module';

@Module({
  imports: [TypeOrmModule.forFeature([ChatRoom, ChatUser, User]), RepositoryModule],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
})
export class ChatModule {}
