import { describe, it, expect } from 'vitest';
import { SearchResult } from '../search-result.vo';

describe('SearchResult', () => {
  it('should create a SearchResult with all fields', () => {
    const result = new SearchResult('id-1', [0.1, 0.2], { source: 'test.md' }, 0.95);

    expect(result.id).toBe('id-1');
    expect(result.vector).toEqual([0.1, 0.2]);
    expect(result.metadata).toEqual({ source: 'test.md' });
    expect(result.score).toBe(0.95);
  });

  it('should handle empty metadata', () => {
    const result = new SearchResult('id-2', [], {}, 0);

    expect(result.metadata).toEqual({});
    expect(result.score).toBe(0);
  });
});
