import React from 'react';
import Link from 'next/link';
import type { MyGroupDto } from '@/lib/api';
import { groupPath } from '@/lib/routes';
import { Money } from '@/components/ui/Money';

interface LobbyGroupCardProps {
  group: MyGroupDto;
}

export function LobbyGroupCard({ group }: LobbyGroupCardProps) {
  return (
    <Link
      href={groupPath(group.id)}
      className="group p-5 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700/80 transition-all flex flex-col justify-between gap-4 active:scale-[0.99] cursor-pointer"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="w-9 h-9 rounded-full bg-accent/15 text-accent border border-accent/30 font-semibold flex items-center justify-center text-sm shrink-0">
            {group.name.charAt(0).toUpperCase()}
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-800/80 border border-zinc-700/60 text-zinc-400">
            {group.memberCount} {group.memberCount === 1 ? 'membro' : 'membros'}
          </span>
        </div>
        <h2 className="text-base font-semibold text-zinc-50 group-hover:text-accent transition-colors truncate">
          {group.name}
        </h2>
        {group.description && (
          <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
            {group.description}
          </p>
        )}
      </div>
      <div className="pt-3 border-t border-zinc-800/80 flex items-baseline justify-between">
        <span className="text-xs text-zinc-400">Total gasto</span>
        <span className="text-base sm:text-lg font-bold text-zinc-50 tabular-nums">
          <Money value={group.totalSpent} />
        </span>
      </div>
    </Link>
  );
}
