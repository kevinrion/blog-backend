import type { Request } from 'express';

export type RequestWithCorrelation = Request & {
  correlationId?: string;
};
