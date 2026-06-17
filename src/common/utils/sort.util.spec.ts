import { parseSortParam } from './sort.util';

describe('sort.util', () => {
  it('parses descending sort', () => {
    expect(parseSortParam('createdAt:desc')).toEqual({
      field: 'createdAt',
      direction: 'desc',
    });
  });

  it('parses ascending sort', () => {
    expect(parseSortParam('title:asc')).toEqual({
      field: 'title',
      direction: 'asc',
    });
  });

  it('returns undefined for empty input', () => {
    expect(parseSortParam(undefined)).toBeUndefined();
  });
});
