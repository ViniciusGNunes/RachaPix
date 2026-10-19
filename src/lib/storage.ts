export interface SavedSplit {
  slug: string;
  adminToken: string | null;
  title: string;
  totalAmount?: number;
  createdAt: string;
}

const SPLITS_STORAGE_KEY = 'rachaconta_saved_splits';

export function getSavedSplits(): SavedSplit[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SPLITS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedSplit[];
  } catch {
    return [];
  }
}

export function saveSplit(split: SavedSplit): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getSavedSplits().filter((s) => s.slug !== split.slug);
    list.unshift(split);
    localStorage.setItem(SPLITS_STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
  } catch (err) {
    console.error('Failed to save split to localStorage:', err);
  }
}

const LAST_CITY_STORAGE_KEY = 'rachaconta_last_city';

export interface LastCity {
  city: string;
  uf: string | null;
}

export function getLastCity(): LastCity | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LAST_CITY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LastCity>;
    return typeof parsed.city === 'string' && parsed.city
      ? { city: parsed.city, uf: parsed.uf ?? null }
      : null;
  } catch {
    return null;
  }
}

export function saveLastCity(value: LastCity): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LAST_CITY_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // storage unavailable; the city just won't be remembered
  }
}

const GROUPS_STORAGE_KEY = 'rachaconta_saved_groups';

export interface SavedGroup {
  id: string;
  name?: string;
  accessToken?: string;
  adminToken?: string;
  /** Personal token from picking who you are in the group; carries your member identity. */
  memberToken?: string;
  memberId?: string;
}

export function getSavedGroups(): SavedGroup[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GROUPS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedGroup[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getGroupCredentials(id: string): SavedGroup | null {
  return getSavedGroups().find((g) => g.id === id) ?? null;
}

export function saveGroup(group: SavedGroup): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getSavedGroups();
    const existing = list.find((g) => g.id === group.id);
    const merged: SavedGroup = {
      id: group.id,
      name: group.name ?? existing?.name,
      accessToken: group.accessToken ?? existing?.accessToken,
      adminToken: group.adminToken ?? existing?.adminToken,
      memberToken: group.memberToken ?? existing?.memberToken,
      memberId: group.memberId ?? existing?.memberId,
    };
    const rest = list.filter((g) => g.id !== group.id);
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify([merged, ...rest].slice(0, 100)));
  } catch (err) {
    console.error('Failed to save group to localStorage:', err);
  }
}

/** Drops the personal token (e.g. the admin freed this member), keeping invite/admin tokens. */
export function forgetMemberIdentity(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getSavedGroups().map((g) =>
      g.id === id ? { ...g, memberToken: undefined, memberId: undefined } : g
    );
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to update group in localStorage:', err);
  }
}

export function removeSavedGroup(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getSavedGroups().filter((g) => g.id !== id);
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to remove group from localStorage:', err);
  }
}

export function removeSavedSplit(slug: string): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getSavedSplits().filter((s) => s.slug !== slug);
    localStorage.setItem(SPLITS_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to remove split from localStorage:', err);
  }
}

export function getSavedSplitToken(slug: string): string | null {
  const found = getSavedSplits().find((s) => s.slug === slug);
  return found?.adminToken ?? null;
}
