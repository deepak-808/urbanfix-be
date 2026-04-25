// Thin wrapper around Passport's 'jwt' strategy guard.
// When applied to a route, it validates the Bearer token in the Authorization header.
// On success, the decoded JwtPayload is attached to request.user.
// On failure (missing/invalid/expired token), it throws 401 Unauthorized.

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
