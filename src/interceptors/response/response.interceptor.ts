import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { ApiResponse } from 'src/types/response.class';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        const response = context
          .switchToHttp()
          .getResponse();

        if (data instanceof ApiResponse) {
          return data;
        }

        return new ApiResponse(
          200,
          'Success',
          data,
        ).toJSON();
      }),
    );
  }
}
