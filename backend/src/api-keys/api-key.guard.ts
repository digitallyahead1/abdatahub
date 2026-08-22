import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { ApiKeyScope } from '../entities/api-key.entity';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private apiKeyService: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader: string = request.headers['authorization'] || '';

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'MISSING_API_KEY',
          message: 'API key required. Pass it as: Authorization: Bearer YOUR_API_KEY',
        },
      });
    }

    const rawKey = authHeader.replace('Bearer ', '').trim();

    // Detect JWT vs API key: JWTs have 3 dot-separated parts
    if (rawKey.split('.').length === 3) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'This endpoint requires an API key, not a JWT token.',
        },
      });
    }

    const apiKey = await this.apiKeyService.validate(rawKey);
    if (!apiKey) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'The provided API key is invalid or has been revoked.',
        },
      });
    }

    // Attach to request for downstream use
    request.apiKey = apiKey;
    request.user = { id: apiKey.userId };

    return true;
  }
}

/**
 * Guard variant that requires FULL scope (purchase operations)
 */
@Injectable()
export class ApiKeyFullScopeGuard extends ApiKeyGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowed = await super.canActivate(context);
    if (!allowed) return false;

    const request = context.switchToHttp().getRequest();
    if (request.apiKey?.scope !== ApiKeyScope.FULL) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'INSUFFICIENT_SCOPE',
          message: 'This operation requires a FULL scope API key.',
        },
      });
    }
    return true;
  }
}
