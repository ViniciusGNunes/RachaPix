import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export function SplitPublicSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-10 w-full space-y-5" aria-busy="true">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 sm:p-5 space-y-4">
        <Skeleton className="h-7 w-2/3 rounded-md" />
        <Skeleton className="h-4 w-1/3 rounded-md" />
        <Skeleton className="h-1.5 w-full rounded-full" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-36 rounded-md" />
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden divide-y divide-zinc-800">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="py-2.5 px-3 sm:px-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-3 w-16 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
