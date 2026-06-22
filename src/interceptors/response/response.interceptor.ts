import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
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
          .getResponse<Response>();

        if (data instanceof ApiResponse) {
          return data;
        }

        return response
          .status(200)
          .json(
            new ApiResponse(200, 'Success', data).toJSON(),
          );
      }),
    );
  }
}
