'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { GroupLookupItem } from '@/lib/api';
import { getSavedGroups, removeSavedGroup, type SavedGroup } from '@/lib/storage';
import { useLookupGroups } from '@/lib/query';

export function useLobbyGroups() {
  const [savedGroups, setSavedGroups] = useState<SavedGroup[]>([]);
  const [mounted, setMounted] = useState(false);

  const reloadSaved = useCallback(() => {
    const list = getSavedGroups();
    setSavedGroups(list);
    return list;
  }, []);

  useEffect(() => {
    reloadSaved();
    setMounted(true);
  }, [reloadSaved]);

  const lookupItems = useMemo<GroupLookupItem[]>(() => {
    if (!mounted) return [];
    return savedGroups.flatMap((g) => {
      const token = g.memberToken ?? g.adminToken ?? g.accessToken;
      return token ? [{ id: g.id, token }] : [];
    });
  }, [mounted, savedGroups]);

  const {
    data: groups,
    isLoading,
    error: queryError,
    refetch,
  } = useLookupGroups(lookupItems, {
    enabled: mounted,
  });

  // Prune unreachable groups from localStorage once data arrives
  useEffect(() => {
    if (!groups || !mounted) return;
    const reachable = new Set(groups.map((g) => g.id));
    savedGroups
      .filter((g) => !reachable.has(g.id))
      .forEach((g) => removeSavedGroup(g.id));
  }, [groups, mounted, savedGroups]);

  const errorMessage = queryError
    ? queryError.message || 'Não foi possível carregar os grupos. Verifique a conexão com o servidor.'
    : null;

  return {
    groups: groups ?? [],
    loading: !mounted || isLoading,
    error: errorMessage,
    refetch,
    reloadSaved,
  };
}
