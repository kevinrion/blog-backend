import { buildPaginatedResponse, normalizePagination } from './pagination.util';
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '../constants/pagination.constant';

describe('pagination.util', () => {
  describe('normalizePagination', () => {
    it('uses defaults when params are omitted', () => {
      expect(normalizePagination()).toEqual({
        page: DEFAULT_PAGE,
        limit: DEFAULT_LIMIT,
        skip: 0,
      });
    });

    it('caps limit at MAX_LIMIT', () => {
      expect(normalizePagination(2, 500)).toEqual({
        page: 2,
        limit: MAX_LIMIT,
        skip: MAX_LIMIT,
      });
    });
  });

  describe('buildPaginatedResponse', () => {
    it('wraps data with meta', () => {
      expect(buildPaginatedResponse(['a', 'b'], 10, 1, 20)).toEqual({
        data: ['a', 'b'],
        meta: { total: 10, page: 1, limit: 20 },
      });
    });
  });
});
