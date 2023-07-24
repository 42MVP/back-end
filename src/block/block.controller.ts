import { Body, Controller, Get, Param, Post, UseFilters } from '@nestjs/common';
import { BlockService } from './block.service';
import { User } from 'src/common/entities/user.entity';
import { QueryFailedErrorFilter } from 'src/common/filters/query-failed.filter';
import { BlockDto } from './dto/block.dto';

@Controller('block')
export class BlockController {
  constructor(private readonly blockService: BlockService) {}

  @Get(':id')
  async getBlockList(@Param('id') id: number): Promise<User[]> {
    return await this.blockService.getBlockList(id);
  }

  @Post()
  @UseFilters(new QueryFailedErrorFilter())
  async block(@Body() blockDto: BlockDto): Promise<void> {
    await this.blockService.addBlockList(blockDto.from, blockDto.to);
  }
}
