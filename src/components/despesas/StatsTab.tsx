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
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-lg border border-zinc-800 bg-zinc-900">
          <p className="text-xs font-medium text-zinc-400">Total gasto no período</p>
          <p className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-50 mt-1 tabular-nums">
            <Money value={stats.totalSpent} />
          </p>
        </div>
        <div className="p-4 sm:p-5 rounded-lg border border-zinc-800 bg-zinc-900">
          <p className="text-xs font-medium text-zinc-400">Média por membro</p>
          <p className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-50 mt-1 tabular-nums">
            <Money value={memberCount > 0 ? stats.totalSpent / memberCount : 0} />
          </p>
        </div>
      </div>

      <StatsCharts stats={stats} />
    </div>
  );
}
