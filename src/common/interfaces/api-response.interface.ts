import type { PaginationMetaDto } from '../dto/pagination-meta.dto';

export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedApiResponse<T> {
  data: T[];
  meta: PaginationMetaDto;
}
