import { Controller, Get, Body, Put, Param, UseGuards, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '../common/entities/user.entity';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchResponseDto } from './dto/search-response.dto';
import { MeUserResponseDto } from './dto/me-user-response.dto';
import { ExtractId } from 'src/common/decorators/extract-id.decorator';
import { OtherUserResponseDto } from './dto/other-user-response.dto';
import { FriendService } from 'src/friend/friend.service';
import { BlockService } from 'src/block/block.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from 'src/s3/s3.service';
import { multerOptions } from 'src/configs/multer-options';

@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly friendshipService: FriendService,
    private readonly blockService: BlockService,
    private readonly s3Service: S3Service,
  ) {}

  @Get('search')
  async findByUsername(@Query() query: SearchQueryDto): Promise<SearchResponseDto[]> {
    const userList: User[] = await this.userService.findAllByUsername(query.name);
    const searchResponseList: SearchResponseDto[] = userList.map(user => new SearchResponseDto(user));
    return searchResponseList;
  }

  @Get('me')
  async getMyProfile(@ExtractId() id: number): Promise<MeUserResponseDto> {
    const user: User = await this.userService.findOneById(id);
    return new MeUserResponseDto(user);
  }

  @Get('id/:id')
  async findOneById(@ExtractId() myId: number, @Param('id') id: number): Promise<OtherUserResponseDto> {
    const isFriend = await this.friendshipService.isFriend(myId, id);
    const isBlock = await this.blockService.isBlock(myId, id);
    const user: User = await this.userService.findOneById(id);
    return new OtherUserResponseDto(user, isFriend, isBlock);
  }

  @Get('name/:name')
  async findOneByName(@ExtractId() myId: number, @Param('name') name: string): Promise<OtherUserResponseDto> {
    const user: User = await this.userService.findOneByUsername(name);
    const isFriend = await this.friendshipService.isFriend(myId, user.id);
    const isBlock = await this.blockService.isBlock(myId, user.id);
    return new OtherUserResponseDto(user, isFriend, isBlock);
  }

  @Get()
  async finAll(): Promise<SearchResponseDto[]> {
    const userList: User[] = await this.userService.findAll();
    const searchResponseList: SearchResponseDto[] = userList.map(user => new SearchResponseDto(user));
    return searchResponseList;
  }

  @Put()
  @UseInterceptors(FileInterceptor('avatar', multerOptions))
  async update(
    @ExtractId() id: number,
    @UploadedFile() avatar: Express.MulterS3.File | null,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<void> {
    if (avatar) {
      const user: User = await this.userService.findOneById(id);
      const url: string = await this.s3Service.avatarUpload(avatar, user.id);
      return await this.userService.updateWithAvatar(id, updateUserDto, url);
    }
    return await this.userService.update(id, updateUserDto);
  }
}
