import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { GameMode } from '../game';
import { isEnum, isNumber } from 'class-validator';

@Injectable()
export class GameModePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (isNumber(value) && isEnum(value, GameMode)) return value as GameMode;
    else throw new BadRequestException('Invalid Game Mode');
  }
}
