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
    <section className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium text-zinc-400">Recentes</h2>
        <span className="text-xs text-zinc-400">Salvos neste navegador</span>
      </div>

      <div className="rounded-md border border-zinc-800 divide-y divide-zinc-800 overflow-hidden">
        {savedSplits.map((split) => {
          const info = totals?.map[split.slug];
          const settled = info ? info.total > 0 && info.paid >= info.total : false;
          return (
            <div
              key={split.slug}
              className="py-2.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-800/40 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-zinc-100 truncate">{split.title}</p>
                  {info && <Badge variant={settled ? 'paid' : 'pending'} size="sm" dot />}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {formatDate(split.createdAt)} · <span className="font-mono text-zinc-400">{split.slug}</span>
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm justify-between sm:justify-end">
                {split.totalAmount ? (
                  <Money value={split.totalAmount} className="text-sm sm:text-base font-semibold text-zinc-50 tabular-nums" />
                ) : null}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={splitPath(split.slug)}
                    className="h-8 px-2.5 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-200 transition-all active:scale-[0.98] inline-flex items-center justify-center cursor-pointer max-sm:h-10"
                  >
                    Abrir
                  </Link>
                  {split.adminToken && (
                    <Link
                      href={splitAdminPath(split.slug, split.adminToken)}
                      className="h-8 px-2.5 rounded-md bg-accent/15 border border-accent/30 hover:bg-accent/25 text-xs font-semibold text-accent transition-all active:scale-[0.98] inline-flex items-center justify-center cursor-pointer max-sm:h-10"
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
