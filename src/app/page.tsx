'use client';

import React, { useEffect, useState } from 'react';
import { useSplitHomeTotals } from '@/hooks/useSplitHomeTotals';
import { getSavedGroups, type SavedGroup } from '@/lib/storage';
import { HomeSplitPanel } from '@/components/splits/HomeSplitPanel';
import { HomeGroupsPanel } from '@/components/despesas/HomeGroupsPanel';

export default function HomePage() {
  const { savedSplits, totals } = useSplitHomeTotals();
  const [savedGroups, setSavedGroups] = useState<SavedGroup[]>([]);

  useEffect(() => {
    setSavedGroups(getSavedGroups());
  }, []);

  return (
    <div className="flex-1 w-full px-3 sm:px-5 lg:px-6 py-3 sm:py-5 animate-fade-up grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:items-stretch">
      <HomeSplitPanel savedSplits={savedSplits} totals={totals} />
      <HomeGroupsPanel savedGroups={savedGroups} />
    </div>
  );
}
