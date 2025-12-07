import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

/**
 * Optional auth guard that always allows access.
 * Used in development mode to bypass authentication.
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Always allow in development
    return true;
  }
}
