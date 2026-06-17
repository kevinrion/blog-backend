import type { ErrorCode } from '../enums/error-code.enum';

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  errorCode: ErrorCode;
  correlationId: string;
}
