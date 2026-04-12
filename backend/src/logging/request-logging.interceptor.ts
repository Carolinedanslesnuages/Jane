import { CallHandler, ExecutionContext, HttpException, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

interface LoggedRequest {
  method: string;
  originalUrl?: string;
  url: string;
  user?: { id: string };
}

/**
 * One line per request: method, path, status, duration and the account. It never logs the query string
 * (it may carry personal data such as an address), the body or the access token.
 */
@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }
    const http = context.switchToHttp();
    const request = http.getRequest<LoggedRequest>();
    const startedAt = Date.now();

    const write = (status: number) => {
      const path = (request.originalUrl ?? request.url).split('?')[0];
      const line = JSON.stringify({
        method: request.method,
        path,
        status,
        durationMs: Date.now() - startedAt,
        userId: request.user?.id ?? null,
      });
      if (status >= 500) {
        this.logger.error(line);
      } else if (status >= 400) {
        this.logger.warn(line);
      } else {
        this.logger.log(line);
      }
    };

    return next.handle().pipe(
      tap({
        next: () => write(http.getResponse<{ statusCode: number }>().statusCode),
        error: (error: unknown) => write(error instanceof HttpException ? error.getStatus() : 500),
      }),
    );
  }
}
