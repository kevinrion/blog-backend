import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '../constants/pagination.constant';
import { PaginationMetaDto } from '../dto/pagination-meta.dto';
import type { PaginatedApiResponse } from '../interfaces/api-response.interface';

export interface NormalizedPagination {
  page: number;
  limit: number;
  skip: number;
}

export function normalizePagination(page?: number, limit?: number): NormalizedPagination {
  const normalizedPage = page && page > 0 ? page : DEFAULT_PAGE;
  const rawLimit = limit && limit > 0 ? limit : DEFAULT_LIMIT;
  const normalizedLimit = Math.min(rawLimit, MAX_LIMIT);

  return {
    page: normalizedPage,
    limit: normalizedLimit,
    skip: (normalizedPage - 1) * normalizedLimit,
  };
}

export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMetaDto {
  return { total, page, limit };
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedApiResponse<T> {
  return {
    data,
    meta: buildPaginationMeta(total, page, limit),
  };
}
