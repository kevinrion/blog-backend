import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { ErrorCode } from '../enums/error-code.enum';
import { CORRELATION_ID_KEY } from '../constants/correlation-id.constant';
import type { ApiErrorResponse } from '../interfaces/api-error-response.interface';
import type { RequestWithCorrelation } from '../types/request-with-correlation.type';

const HTTP_ERROR_MAP: Record<number, { errorCode: ErrorCode; fallback: string }> = {
  400: { errorCode: ErrorCode.VALIDATION_FAILED, fallback: 'Validation failed' },
  401: { errorCode: ErrorCode.UNAUTHORIZED, fallback: 'Unauthorized' },
  403: { errorCode: ErrorCode.FORBIDDEN, fallback: 'Forbidden' },
  404: { errorCode: ErrorCode.NOT_FOUND, fallback: 'Not found' },
  409: { errorCode: ErrorCode.CONFLICT, fallback: 'Conflict' },
  429: {
    errorCode: ErrorCode.TOO_MANY_REQUESTS,
    fallback: 'Too many requests',
  },
  503: {
    errorCode: ErrorCode.INTERNAL_ERROR,
    fallback: 'Service unavailable',
  },
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithCorrelation>();
    const correlationId = request[CORRELATION_ID_KEY] ?? 'unknown';

    const { statusCode, message, errorCode } = this.resolveException(exception);

    this.logger.error(
      {
        correlationId,
        statusCode,
        errorCode,
        path: request.url,
        method: request.method,
      },
      exception instanceof Error ? exception.stack : String(exception),
    );

    const body: ApiErrorResponse = {
      statusCode,
      message,
      errorCode,
      correlationId,
    };

    response.status(statusCode).json(body);
  }

  private resolveException(exception: unknown): {
    statusCode: number;
    message: string;
    errorCode: ErrorCode;
  } {
    if (exception instanceof HttpException) {
      return this.resolveHttpException(exception);
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
      errorCode: ErrorCode.INTERNAL_ERROR,
    };
  }

  private resolveHttpException(exception: HttpException): {
    statusCode: number;
    message: string;
    errorCode: ErrorCode;
  } {
    const statusCode = exception.getStatus();
    const response = exception.getResponse();

    if (statusCode in HTTP_ERROR_MAP) {
      const mapping = HTTP_ERROR_MAP[statusCode];
      return {
        statusCode,
        message: this.extractMessage(response, mapping.fallback),
        errorCode: mapping.errorCode,
      };
    }

    return {
      statusCode,
      message: this.extractMessage(response, 'Request failed'),
      errorCode: ErrorCode.INTERNAL_ERROR,
    };
  }

  private extractMessage(response: string | object, fallback: string): string {
    if (typeof response === 'string') {
      return response;
    }

    if ('message' in response) {
      const { message } = response;

      if (typeof message === 'string') {
        return message;
      }

      if (Array.isArray(message)) {
        return message.join(', ');
      }
    }

    return fallback;
  }
}
