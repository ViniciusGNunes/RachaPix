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
      className="group p-4 rounded-lg bg-zinc-900 hover:bg-zinc-800/60 border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col justify-between gap-3 cursor-pointer"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="w-8 h-8 rounded-full bg-accent/15 text-accent border border-accent/30 font-semibold flex items-center justify-center text-xs shrink-0">
            {group.name.charAt(0).toUpperCase()}
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-800 border border-zinc-700 text-zinc-300">
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
      <div className="pt-2.5 border-t border-zinc-800 flex items-baseline justify-between">
        <span className="text-xs text-zinc-400">Total gasto</span>
        <span className="text-base font-semibold text-zinc-50 tabular-nums">
          <Money value={group.totalSpent} />
        </span>
      </div>
    </Link>
  );
}
