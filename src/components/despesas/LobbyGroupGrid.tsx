import React from 'react';
import type { MyGroupDto } from '@/lib/api';
import { LobbyGroupCard } from './LobbyGroupCard';

interface LobbyGroupGridProps {
  groups: MyGroupDto[];
}

export function LobbyGroupGrid({ groups }: LobbyGroupGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {groups.map((group) => (
        <LobbyGroupCard key={group.id} group={group} />
      ))}
    </div>
  );
}
