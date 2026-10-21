import type { GroupLookupItem } from '@/lib/api';

export interface ExpenseFilters {
  from?: string;
  to?: string;
  category?: string;
  memberId?: string;
}

export interface StatsFilters {
  from?: string;
  to?: string;
}

export const splitKeys = {
  all: ['splits'] as const,
  public: (slug: string) => [...splitKeys.all, 'public', slug] as const,
  admin: (slug: string, token: string) => [...splitKeys.all, 'admin', slug, token] as const,
  participantPix: (slug: string, participantId: string) =>
    [...splitKeys.all, 'participantPix', slug, participantId] as const,
};

export const groupKeys = {
  all: ['groups'] as const,
  lookups: () => [...groupKeys.all, 'lookup'] as const,
  lookup: (items: GroupLookupItem[]) => [...groupKeys.lookups(), items] as const,
  details: () => [...groupKeys.all, 'detail'] as const,
  detail: (id: string) => [...groupKeys.details(), id] as const,
  devicesList: (groupId: string) => [...groupKeys.all, 'devices', groupId] as const,
  memberPix: (groupId: string, memberId: string, amount: number) =>
    [...groupKeys.all, 'memberPix', groupId, memberId, amount] as const,
  expenses: (groupId: string, filters?: ExpenseFilters) =>
    [...groupKeys.all, 'expenses', groupId, ...(filters ? [filters] : [])] as const,
  expense: (groupId: string, expenseId: string) =>
    [...groupKeys.all, 'expense', groupId, expenseId] as const,
  settlements: (groupId: string) => [...groupKeys.all, 'settlements', groupId] as const,
  balances: (groupId: string) => [...groupKeys.all, 'balances', groupId] as const,
  stats: (groupId: string, filters?: StatsFilters) =>
    [...groupKeys.all, 'stats', groupId, ...(filters ? [filters] : [])] as const,
};
