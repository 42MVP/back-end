import { Controller, Get, Post, UseFilters, Delete, UseGuards, Param } from '@nestjs/common';
import { BlockService } from './block.service';
import { User } from '../common/entities/user.entity';
import { QueryFailedErrorFilter } from '../common/filters/query-failed.filter';
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
    this.blockService.addConnectionState(userResponseList);

    return userResponseList;
  }

  @Post('/:id')
  @UseFilters(new QueryFailedErrorFilter())
  async block(@ExtractId() me: number, @Param('id') target: number): Promise<void> {
    await this.blockService.addBlockList(me, target);
  }

  @Delete('/:id')
  async unfolllw(@ExtractId() me: number, @Param('id') target: number): Promise<void> {
    await this.blockService.removeBlockList(me, target);
  }
}
