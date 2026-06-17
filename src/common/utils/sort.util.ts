export type SortDirection = 'asc' | 'desc';

export interface ParsedSort {
  field: string;
  direction: SortDirection;
}

export function parseSortParam(sort?: string): ParsedSort | undefined {
  if (!sort) {
    return undefined;
  }

  const [field, direction] = sort.split(':');

  if (!field) {
    return undefined;
  }

  return {
    field,
    direction: direction === 'asc' ? 'asc' : 'desc',
  };
}
