import React from 'react';
import Link from 'next/link';
import type { SavedSplit } from '@/lib/storage';
import { splitAdminPath, splitPath } from '@/lib/routes';
import { formatDate } from '@/lib/formatters';
import { Money } from '@/components/ui/Money';
import { Badge } from '@/components/ui/Badge';
import type { SplitTotals } from '@/hooks/useSplitHomeTotals';

interface SplitHomeRecentListProps {
  savedSplits: SavedSplit[];
  totals: SplitTotals | null;
}

export function SplitHomeRecentList({ savedSplits, totals }: SplitHomeRecentListProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-medium text-zinc-400">Recentes</h2>
        <span className="text-xs text-zinc-500">Salvos neste navegador</span>
      </div>

      <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800/80 divide-y divide-zinc-800/80 overflow-hidden">
        {savedSplits.map((split) => {
          const info = totals?.map[split.slug];
          const settled = info ? info.total > 0 && info.paid >= info.total : false;
          return (
            <div
              key={split.slug}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-900/50 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <p className="text-sm font-semibold text-zinc-100 truncate">{split.title}</p>
                  {info && <Badge variant={settled ? 'paid' : 'pending'} size="sm" dot />}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  {formatDate(split.createdAt)} · <span className="font-mono text-zinc-400">{split.slug}</span>
                </p>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 text-sm justify-between sm:justify-end">
                {split.totalAmount ? (
                  <Money value={split.totalAmount} className="text-base sm:text-lg font-semibold text-zinc-50 tabular-nums" />
                ) : null}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={splitPath(split.slug)}
                    className="h-9 px-3 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 hover:border-zinc-700 text-xs font-medium text-zinc-200 transition-all active:scale-[0.98] inline-flex items-center justify-center cursor-pointer"
                  >
                    Abrir
                  </Link>
                  {split.adminToken && (
                    <Link
                      href={splitAdminPath(split.slug, split.adminToken)}
                      className="h-9 px-3 rounded-xl bg-accent/15 border border-accent/30 hover:bg-accent/25 text-xs font-semibold text-accent transition-all active:scale-[0.98] inline-flex items-center justify-center cursor-pointer"
                    >
                      Administrar
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
