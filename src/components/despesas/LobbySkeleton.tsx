import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export function LobbySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-36 w-full rounded-lg bg-zinc-900 border border-zinc-800 p-4 flex flex-col justify-between"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="w-20 h-4 rounded-full" />
            </div>
            <Skeleton className="w-3/4 h-4 rounded-md" />
            <Skeleton className="w-1/2 h-3 rounded-md" />
          </div>
          <div className="pt-2.5 border-t border-zinc-800 flex items-center justify-between">
            <Skeleton className="w-16 h-3 rounded-md" />
            <Skeleton className="w-24 h-4 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
