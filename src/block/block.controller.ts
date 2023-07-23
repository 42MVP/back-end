import { Controller, Get, Param } from '@nestjs/common';
import { BlockService } from './block.service';
import { User } from 'src/common/entities/user.entity';

@Controller('block')
export class BlockController {
  constructor(private readonly blockService: BlockService) {}

  @Get(':id')
  async getBlockList(@Param('id') id: number): Promise<User[]> {
    return await this.blockService.getBlockList(id);
  }
}
