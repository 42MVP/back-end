import { Module } from '@nestjs/common';
import { TempGateway } from './temp.gateway';

@Module({
  providers: [TempGateway],
})
export class TempModule {}
