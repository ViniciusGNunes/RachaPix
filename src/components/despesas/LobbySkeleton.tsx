import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export function LobbySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-44 w-full rounded-2xl bg-zinc-900/40 border border-zinc-800/80 p-5 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="w-9 h-9 rounded-full" />
              <Skeleton className="w-20 h-5 rounded-full" />
            </div>
            <Skeleton className="w-3/4 h-5 rounded-lg" />
            <Skeleton className="w-1/2 h-3 rounded-lg" />
          </div>
          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
            <Skeleton className="w-16 h-3 rounded-lg" />
            <Skeleton className="w-24 h-5 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
