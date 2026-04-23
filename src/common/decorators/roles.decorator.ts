// Decorator that attaches a list of allowed roles to a route handler.
// Read by RolesGuard to enforce role-based access control.

import { SetMetadata } from '@nestjs/common';

// Key used to store/retrieve the roles metadata via Reflector
export const ROLES_KEY = 'roles';

// Usage: @Roles('admin') or @Roles('provider', 'admin')
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
