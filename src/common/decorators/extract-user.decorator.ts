import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../common/entities/user.entity';

export const ExtractUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return User.from(request.user);
});
