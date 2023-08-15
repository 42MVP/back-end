import { Body, Controller, Get, Post, UseFilters, Delete, UseGuards } from '@nestjs/common';
import { BlockService } from './block.service';
import { User } from '../common/entities/user.entity';
import { QueryFailedErrorFilter } from '../common/filters/query-failed.filter';
import { BlockDto } from './dto/block.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { ExtractId } from 'src/common/decorators/extract-id.decorator';
import { UserResponseBaseDto } from 'src/user/dto/user-response-base.dto';

@UseGuards(JwtAuthGuard)
@Controller('block')
export class BlockController {
  constructor(private readonly blockService: BlockService) {}

  @Get()
  async getBlockList(@ExtractId() id: number): Promise<UserResponseBaseDto[]> {
    const userList: User[] = await this.blockService.getBlockList(id);
    const userResponseList: UserResponseBaseDto[] = userList.map(user => new UserResponseBaseDto(user));
    return userResponseList;
  }

  @Post()
  @UseFilters(new QueryFailedErrorFilter())
  async block(@Body() blockDto: BlockDto): Promise<void> {
    await this.blockService.addBlockList(blockDto.from, blockDto.to);
  }

  @Delete()
  async unfolllw(@Body() blockDto: BlockDto): Promise<void> {
    await this.blockService.removeBlockList(blockDto.from, blockDto.to);
  }
}
