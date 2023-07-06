import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatRoom } from 'src/database/entities/chatroom.entity';
import { User } from 'src/database/entities/user.entity';
import { ChatUser } from 'src/database/entities/chatuser.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatRoom]),
    TypeOrmModule.forFeature([ChatUser]),
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
