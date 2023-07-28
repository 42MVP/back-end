import { Module } from '@nestjs/common';
import { ConnectionService } from './connection.service';
import { ConnectionGateway } from './connection.gateway';
import { RepositoryModule } from 'src/repository/repository.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [RepositoryModule, AuthModule],
  providers: [ConnectionGateway, ConnectionService],
})
export class ConnectionModule {}
