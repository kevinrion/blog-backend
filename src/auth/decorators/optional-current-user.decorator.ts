import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from '../interfaces/auth.interface';
import type { RequestWithCorrelation } from '../../common/types/request-with-correlation.type';

type RequestWithUser = RequestWithCorrelation & {
  user?: AuthenticatedUser;
};

export const OptionalCurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser | undefined => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
