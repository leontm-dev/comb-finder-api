import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiResponse } from 'src/types/response.class';

@Catch()
export class ExceptionsFilter<
  T,
> implements ExceptionFilter {
  private logger = new Logger(ExceptionsFilter.name);
  catch(exception: T, host: ArgumentsHost) {
    const response = host
      .switchToHttp()
      .getResponse<Response>();

    this.logger.error(exception);
    if (exception instanceof HttpException) {
      response
        .status(exception.getStatus())
        .json(
          new ApiResponse(
            exception.getStatus(),
            exception.message,
            null,
          ).toJSON(),
        );
      return;
    }
    response
      .status(500)
      .json(
        new ApiResponse(
          500,
          'Internal unhandled server error. Please try again.',
          null,
        ).toJSON(),
      );
  }
}
