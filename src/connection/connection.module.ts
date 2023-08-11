import { Logger, Module } from '@nestjs/common';
import { ConnectionService } from './connection.service';
import { ConnectionGateway } from './connection.gateway';
import { RepositoryModule } from 'src/repository/repository.module';
import { AuthModule } from 'src/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatUser } from 'src/common/entities/chatuser.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatUser]), RepositoryModule, AuthModule],
  providers: [ConnectionGateway, ConnectionService],
})
export class ConnectionModule {}
