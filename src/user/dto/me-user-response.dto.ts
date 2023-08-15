import { PartialType } from '@nestjs/mapped-types';
import { GameHistoryResponseDto } from 'src/game-history/dto/game-history-response.dto';
import { UserResponseBaseDto } from './user-response-base.dto';

export class MeUserResponseDto extends PartialType(UserResponseBaseDto) {
  gameHistory: GameHistoryResponseDto[];
}
