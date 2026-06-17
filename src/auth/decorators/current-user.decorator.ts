import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from '../interfaces/auth.interface';
import type { RequestWithCorrelation } from '../../common/types/request-with-correlation.type';

type RequestWithUser = RequestWithCorrelation & {
  user?: AuthenticatedUser;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    if (!request.user) {
      throw new Error('CurrentUser decorator used without authentication');
    }

    return request.user;
  },
);
