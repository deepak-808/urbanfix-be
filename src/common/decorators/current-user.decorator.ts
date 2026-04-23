// Custom parameter decorator that extracts the authenticated user from the request.
// Passport's JwtStrategy attaches the decoded JWT payload to `request.user`
// after validating the bearer token; this decorator surfaces it cleanly.

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../../auth/auth.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    // `request.user` is populated by JwtStrategy.validate() on every guarded route
    return request.user;
  },
);
