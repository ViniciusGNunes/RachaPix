import React from 'react';
import { Money } from '@/components/ui/Money';
import type { SplitTotals } from '@/hooks/useSplitHomeTotals';

interface SplitHomeTotalsProps {
  totals: SplitTotals;
  count: number;
}

export function SplitHomeTotals({ totals, count }: SplitHomeTotalsProps) {
  return (
    <section className="p-5 sm:p-7 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
      <p className="text-[13px] font-medium text-zinc-400">Falta receber</p>
      <Money
        value={totals.pending}
        animate
        className="block text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-zinc-50 tabular-nums my-1"
      />
      <p className="text-sm text-zinc-400">
        {count} {count === 1 ? 'racha' : 'rachas'} ·{' '}
        <Money value={totals.received} className="text-zinc-300 font-medium" /> recebido
      </p>
    </section>
  );
}
