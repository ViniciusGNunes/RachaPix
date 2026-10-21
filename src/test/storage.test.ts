import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  storage,
  getSavedSplits,
  saveSplit,
  removeSavedSplit,
  getSavedSplitToken,
  getSavedGroups,
  saveGroup,
  getGroupCredentials,
  forgetMemberIdentity,
  removeSavedGroup,
  getLastCity,
  saveLastCity,
  type SavedSplit,
  type SavedGroup,
} from '@/lib/storage';

describe('storage.ts', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('safe storage helper', () => {
    it('sets, gets and removes items successfully in jsdom', () => {
      expect(storage.getItem('my_key')).toBeNull();
      expect(storage.setItem('my_key', 'hello')).toBe(true);
      expect(storage.getItem('my_key')).toBe('hello');
      expect(storage.removeItem('my_key')).toBe(true);
      expect(storage.getItem('my_key')).toBeNull();
    });

    it('handles corrupted JSON gracefully without throwing', () => {
      localStorage.setItem('corrupted', '{not-valid-json');
      expect(storage.getJSON('corrupted')).toBeNull();
    });

    it('handles quota exceeded error on setItem without throwing', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
        throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
      });

      const result = storage.setItem('quota_key', 'val');
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save to localStorage:',
        expect.any(DOMException)
      );
    });

    it('handles removal errors without throwing', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementationOnce(() => {
        throw new Error('Storage lock error');
      });

      const result = storage.removeItem('lock_key');
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('Splits storage', () => {
    it('returns empty array when empty or corrupted', () => {
      expect(getSavedSplits()).toEqual([]);

      localStorage.setItem('rachaconta_saved_splits', '{"not":"an array"}');
      expect(getSavedSplits()).toEqual([]);

      localStorage.setItem('rachaconta_saved_splits', 'invalid-json');
      expect(getSavedSplits()).toEqual([]);
    });

    it('saves split, deduplicates by slug, and retrieves token', () => {
      const split1: SavedSplit = {
        slug: 'split-1',
        title: 'Churrasco',
        adminToken: 'token-123',
        createdAt: '2026-10-21T10:00:00Z',
      };
      saveSplit(split1);

      expect(getSavedSplits()).toHaveLength(1);
      expect(getSavedSplitToken('split-1')).toBe('token-123');
      expect(getSavedSplitToken('non-existent')).toBeNull();

      // Update existing split with same slug
      const split1Updated: SavedSplit = {
        ...split1,
        title: 'Churrasco Atualizado',
      };
      saveSplit(split1Updated);

      const list = getSavedSplits();
      expect(list).toHaveLength(1);
      expect(list[0].title).toBe('Churrasco Atualizado');
    });

    it('removes split correctly', () => {
      saveSplit({
        slug: 'split-to-remove',
        title: 'Para Deletar',
        adminToken: null,
        createdAt: '2026-10-21T10:00:00Z',
      });
      expect(getSavedSplits()).toHaveLength(1);

      removeSavedSplit('split-to-remove');
      expect(getSavedSplits()).toHaveLength(0);
    });
  });

  describe('Groups storage', () => {
    it('returns empty array when empty or corrupted', () => {
      expect(getSavedGroups()).toEqual([]);

      localStorage.setItem('rachaconta_saved_groups', 'not-json');
      expect(getSavedGroups()).toEqual([]);
    });

    it('saves group, merges fields, and retrieves credentials', () => {
      const group: SavedGroup = {
        id: 'group-uuid-1',
        name: 'Viagem Praia',
        accessToken: 'invite-token',
        adminToken: 'admin-token',
      };
      saveGroup(group);

      expect(getGroupCredentials('group-uuid-1')).toEqual(group);
      expect(getGroupCredentials('unknown')).toBeNull();

      // Update member identity
      saveGroup({
        id: 'group-uuid-1',
        memberToken: 'personal-member-token',
        memberId: 'member-uuid-1',
      });

      const updated = getGroupCredentials('group-uuid-1');
      expect(updated?.name).toBe('Viagem Praia');
      expect(updated?.accessToken).toBe('invite-token');
      expect(updated?.adminToken).toBe('admin-token');
      expect(updated?.memberToken).toBe('personal-member-token');
      expect(updated?.memberId).toBe('member-uuid-1');
    });

    it('forgets member identity while retaining group and admin tokens', () => {
      saveGroup({
        id: 'group-uuid-2',
        name: 'República',
        accessToken: 'acc',
        adminToken: 'adm',
        memberToken: 'mem',
        memberId: 'm1',
      });

      forgetMemberIdentity('group-uuid-2');
      const creds = getGroupCredentials('group-uuid-2');
      expect(creds?.memberToken).toBeUndefined();
      expect(creds?.memberId).toBeUndefined();
      expect(creds?.adminToken).toBe('adm');
      expect(creds?.accessToken).toBe('acc');
    });

    it('removes saved group', () => {
      saveGroup({ id: 'group-3', name: 'Almoço' });
      expect(getSavedGroups()).toHaveLength(1);

      removeSavedGroup('group-3');
      expect(getSavedGroups()).toHaveLength(0);
    });
  });

  describe('Last city storage', () => {
    it('returns null on empty or invalid data', () => {
      expect(getLastCity()).toBeNull();

      localStorage.setItem('rachaconta_last_city', '{"city":123}');
      expect(getLastCity()).toBeNull();
    });

    it('saves and reads last city with UF', () => {
      saveLastCity({ city: 'Belo Horizonte', uf: 'MG' });
      expect(getLastCity()).toEqual({ city: 'Belo Horizonte', uf: 'MG' });
    });
  });
});
