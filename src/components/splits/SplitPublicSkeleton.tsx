import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export function SplitPublicSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-12 w-full space-y-6" aria-busy="true">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4 shadow-sm">
        <Skeleton className="h-8 w-2/3 rounded-lg" />
        <Skeleton className="h-4 w-1/3 rounded-md" />
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-36 rounded-lg" />
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 overflow-hidden divide-y divide-zinc-800/60 shadow-sm">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-3 w-16 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-10 w-28 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
