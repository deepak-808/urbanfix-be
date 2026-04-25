// Passport JWT strategy — verifies incoming Bearer tokens and
// extracts the decoded payload, which is then attached to request.user
// by NestJS's JwtAuthGuard for use in @CurrentUser() and RolesGuard.

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Extract token from the standard "Authorization: Bearer <token>" header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Reject expired tokens — client must re-login after 7 days
      ignoreExpiration: false,
      // Must match the secret used when signing in AuthService
      secretOrKey: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    });
  }

  // Called after signature verification — return value becomes request.user.
  // Throw here to reject tokens that are structurally valid but logically invalid.
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (!payload.sub) throw new UnauthorizedException();
    return payload;
  }
}
