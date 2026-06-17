import { slugify } from './slug.util';

describe('slugify', () => {
  it('converts titles to URL-safe slugs', () => {
    expect(slugify('Hello World!')).toBe('hello-world');
  });
});
