import React from 'react';
import { Money } from '@/components/ui/Money';
import type { SplitTotals } from '@/hooks/useSplitHomeTotals';

interface SplitHomeTotalsProps {
  totals: SplitTotals;
  count: number;
}

export function SplitHomeTotals({ totals, count }: SplitHomeTotalsProps) {
  return (
    <section className="p-4 sm:p-5 rounded-md bg-zinc-900/30 border border-zinc-800 space-y-1.5">
      <p className="text-xs font-medium text-zinc-400">Falta receber</p>
      <Money
        value={totals.pending}
        animate
        className="block text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-50 tabular-nums my-0.5"
      />
      <p className="text-xs sm:text-sm text-zinc-400">
        {count} {count === 1 ? 'racha' : 'rachas'} ·{' '}
        <Money value={totals.received} className="text-zinc-300 font-medium" /> recebido
      </p>
    </section>
  );
}
