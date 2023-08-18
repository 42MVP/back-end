import { Module } from '@nestjs/common';
import { GameMatchingService } from './game-matching.service';
import { GameMatchingGateway } from './game-matching.gateway';
import { GameMatchingController } from './game-matching.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { QueueService } from './queue.service';
import { RepositoryModule } from 'src/repository/repository.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/common/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User]), ScheduleModule.forRoot(), RepositoryModule],
  controllers: [GameMatchingController],
  providers: [GameMatchingGateway, GameMatchingService, QueueService],
})
export class GameMatchingModule {}
