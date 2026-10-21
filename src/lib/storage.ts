export interface SavedSplit {
  slug: string;
  adminToken: string | null;
  title: string;
  totalAmount?: number;
  createdAt: string;
}

/** Safe wrapper around browser localStorage for SSR and restricted storage environments. */
export const storage = {
  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): boolean {
    if (typeof window === 'undefined') return false;
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
      return false;
    }
  },
  removeItem(key: string): boolean {
    if (typeof window === 'undefined') return false;
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (err) {
      console.error('Failed to remove from localStorage:', err);
      return false;
    }
  },
  getJSON<T>(key: string): T | null {
    const raw = this.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
};

const SPLITS_STORAGE_KEY = 'rachaconta_saved_splits';

export function getSavedSplits(): SavedSplit[] {
  const parsed = storage.getJSON<SavedSplit[]>(SPLITS_STORAGE_KEY);
  return Array.isArray(parsed) ? parsed : [];
}

export function saveSplit(split: SavedSplit): void {
  const list = getSavedSplits().filter((s) => s.slug !== split.slug);
  list.unshift(split);
  storage.setItem(SPLITS_STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
}

const LAST_CITY_STORAGE_KEY = 'rachaconta_last_city';

export interface LastCity {
  city: string;
  uf: string | null;
}

export function getLastCity(): LastCity | null {
  const parsed = storage.getJSON<Partial<LastCity>>(LAST_CITY_STORAGE_KEY);
  if (!parsed) return null;
  return typeof parsed.city === 'string' && parsed.city
    ? { city: parsed.city, uf: parsed.uf ?? null }
    : null;
}

export function saveLastCity(value: LastCity): void {
  storage.setItem(LAST_CITY_STORAGE_KEY, JSON.stringify(value));
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
  const parsed = storage.getJSON<SavedGroup[]>(GROUPS_STORAGE_KEY);
  return Array.isArray(parsed) ? parsed : [];
}

export function getGroupCredentials(id: string): SavedGroup | null {
  return getSavedGroups().find((g) => g.id === id) ?? null;
}

export function saveGroup(group: SavedGroup): void {
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
  storage.setItem(GROUPS_STORAGE_KEY, JSON.stringify([merged, ...rest].slice(0, 100)));
}

/** Drops the personal token (e.g. the admin freed this member), keeping invite/admin tokens. */
export function forgetMemberIdentity(id: string): void {
  const list = getSavedGroups().map((g) =>
    g.id === id ? { ...g, memberToken: undefined, memberId: undefined } : g
  );
  storage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(list));
}

export function removeSavedGroup(id: string): void {
  const list = getSavedGroups().filter((g) => g.id !== id);
  storage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(list));
}

export function removeSavedSplit(slug: string): void {
  const list = getSavedSplits().filter((s) => s.slug !== slug);
  storage.setItem(SPLITS_STORAGE_KEY, JSON.stringify(list));
}

export function getSavedSplitToken(slug: string): string | null {
  const found = getSavedSplits().find((s) => s.slug === slug);
  return found?.adminToken ?? null;
}
