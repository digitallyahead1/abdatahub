import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

@Injectable()
export class ApiRateLimitGuard implements CanActivate {
  // In-memory sliding-window store: key -> { count, resetTime }
  private store: Map<string, RateLimitEntry> = new Map();

  // 100 requests per minute by default
  private readonly WINDOW_MS = 60 * 1000;
  private readonly MAX_REQUESTS = 100;

  constructor() {
    // Periodic cleanup of expired entries every 2 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [k, v] of this.store.entries()) {
        if (now > v.resetTime) {
          this.store.delete(k);
        }
      }
    }, 2 * 60 * 1000);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Identify client by API key ID or fallback to IP
    const clientId = request.apiKey?.id || request.ip || request.connection?.remoteAddress || 'unknown';
    const now = Date.now();

    let entry = this.store.get(clientId);

    if (!entry || now > entry.resetTime) {
      entry = { count: 1, resetTime: now + this.WINDOW_MS };
      this.store.set(clientId, entry);
    } else {
      entry.count += 1;
    }

    const remaining = Math.max(0, this.MAX_REQUESTS - entry.count);
    const resetSeconds = Math.ceil((entry.resetTime - now) / 1000);

    // Set standard rate limit headers
    response.setHeader('X-RateLimit-Limit', this.MAX_REQUESTS);
    response.setHeader('X-RateLimit-Remaining', remaining);
    response.setHeader('X-RateLimit-Reset', resetSeconds);

    if (entry.count > this.MAX_REQUESTS) {
      response.setHeader('Retry-After', resetSeconds);
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Rate limit exceeded. Maximum ${this.MAX_REQUESTS} requests per minute. Retry in ${resetSeconds}s.`,
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
