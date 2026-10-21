'use client';

import React from 'react';
import { Money } from '@/components/ui/Money';
import { StatsCharts } from '@/components/despesas/StatsCharts';
import { useStats } from '@/lib/query';

interface StatsTabProps {
  groupId: string;
  memberCount: number;
  filterFrom?: string;
  filterTo?: string;
}

export function StatsTab({
  groupId,
  memberCount,
  filterFrom,
  filterTo,
}: Readonly<StatsTabProps>) {
  const { data: stats } = useStats(groupId, {
    from: filterFrom || undefined,
    to: filterTo || undefined,
  });

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="p-5 sm:p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 shadow-sm">
          <p className="text-[13px] font-medium text-zinc-400">Total gasto no período</p>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-50 mt-1 tabular-nums">
            <Money value={stats.totalSpent} />
          </p>
        </div>
        <div className="p-5 sm:p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 shadow-sm">
          <p className="text-[13px] font-medium text-zinc-400">Média por membro</p>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-50 mt-1 tabular-nums">
            <Money value={memberCount > 0 ? stats.totalSpent / memberCount : 0} />
          </p>
        </div>
      </div>

      <StatsCharts stats={stats} />
    </div>
  );
}
