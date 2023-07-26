import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Response } from 'express';

@Catch(QueryFailedError)
export class QueryFailedErrorFilter implements ExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res: Response = ctx.getResponse();

    if (exception instanceof QueryFailedError) {
      if (exception.driverError.code == 23505) {
        res.status(HttpStatus.CONFLICT).json({
          message: '이미 친구로 추가한 유저입니다!',
          error: 'Conflict',
          statusCode: HttpStatus.CONFLICT,
        });
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          message: 'DB 에러가 발생했습니다!',
          error: 'Internal Server Error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        });
      }
    }
  }
}
