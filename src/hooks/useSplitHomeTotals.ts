'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getSavedSplits, type SavedSplit } from '@/lib/storage';
import { splitKeys } from '@/lib/query';

export interface SplitTotals {
  received: number;
  pending: number;
  map: Record<string, { total: number; paid: number }>;
}

export function useSplitHomeTotals() {
  const [savedSplits, setSavedSplits] = useState<SavedSplit[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setSavedSplits(getSavedSplits());
    setMounted(true);
  }, []);

  const recent = useMemo(() => savedSplits.slice(0, 5), [savedSplits]);

  const splitQueries = useQueries({
    queries: recent.map((s) => ({
      queryKey: splitKeys.public(s.slug),
      queryFn: () => api.getSplitPublic(s.slug),
      enabled: mounted && Boolean(s.slug),
      staleTime: 1000 * 30,
    })),
  });

  const totals = useMemo<SplitTotals | null>(() => {
    if (!mounted || splitQueries.length === 0) return null;

    const map: SplitTotals['map'] = {};
    let received = 0;
    let pending = 0;
    let hasAnyData = false;

    splitQueries.forEach((query, index) => {
      const split = recent[index];
      if (!split || !query.data) return;

      hasAnyData = true;
      const total = query.data.totalAmount;
      const paid = query.data.paidAmount;
      map[split.slug] = { total, paid };
      received += paid;
      pending += Math.max(0, total - paid);
    });

    if (!hasAnyData) return null;
    return { received, pending, map };
  }, [mounted, recent, splitQueries]);

  const hasSplits = mounted && savedSplits.length > 0;

  return {
    savedSplits,
    mounted,
    totals,
    hasSplits,
  };
}
