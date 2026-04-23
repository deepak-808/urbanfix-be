// Guard that enforces role-based access control (RBAC).
// Works together with the @Roles() decorator — routes without the decorator
// are accessible to any authenticated user.

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Read the roles list attached by @Roles() on the handler or controller
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No @Roles() decorator → open to any authenticated user
    if (!requiredRoles) return true;

    // `user` is populated by JwtStrategy after the JwtAuthGuard runs
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user?.role);
  }
}
