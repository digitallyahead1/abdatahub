import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required to access this resource.');
    }

    // Super Admin bypasses all checks
    if (user.role === 'super_admin') {
      return true;
    }

    // Non-admins (e.g. user, agent) are rejected for admin-only permission gated routes
    if (user.role !== 'admin') {
      throw new ForbiddenException('Access denied. Administrative role required.');
    }

    // Check if the admin has the required permission
    const userPermissions = user.permissions || [];
    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Access denied. Insufficient administrative permissions.');
    }

    return true;
  }
}
