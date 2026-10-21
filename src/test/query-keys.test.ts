import { describe, it, expect } from 'vitest';
import { QueryClient, matchQuery } from '@tanstack/react-query';
import { groupKeys } from '@/lib/query/keys';

describe('groupKeys invalidation prefixes', () => {
  it('expenses key without filters is a prefix of filtered expenses keys', () => {
    const filtered = groupKeys.expenses('g1', { from: '2026-01-01', memberId: 'm1' });
    expect(matchQuery({ queryKey: groupKeys.expenses('g1') }, { queryKey: filtered } as never)).toBe(true);
  });

  it('stats key without filters is a prefix of filtered stats keys', () => {
    const filtered = groupKeys.stats('g1', { from: '2026-01-01' });
    expect(matchQuery({ queryKey: groupKeys.stats('g1') }, { queryKey: filtered } as never)).toBe(true);
  });

  it('invalidating expenses refetches a query that has filters', async () => {
    const client = new QueryClient();
    let calls = 0;
    await client.fetchQuery({
      queryKey: groupKeys.expenses('g1', { category: 'Food' }),
      queryFn: async () => ++calls,
    });
    client.getQueryCache().find({ queryKey: groupKeys.expenses('g1', { category: 'Food' }) });
    await client.invalidateQueries({ queryKey: groupKeys.expenses('g1') });
    const query = client.getQueryCache().find({ queryKey: groupKeys.expenses('g1', { category: 'Food' }) });
    expect(query?.state.isInvalidated).toBe(true);
  });
});
