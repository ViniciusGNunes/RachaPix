import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, ApiError, IDENTITY_LOST_EVENT, type GroupDto } from '@/lib/api';
import { describeThisDevice } from '@/lib/device';
import { groupKeys } from '@/lib/query';
import {
  forgetMemberIdentity,
  getGroupCredentials,
  saveGroup,
} from '@/lib/storage';
import { toast } from '@/components/ui/Toast';

const LIVE_REFRESH_MS = 15000;

/**
 * Stores the invite (#t) and admin (#a) tokens from the URL hash.
 * Runs during the first render so the first request already carries them.
 */
export function saveHashCredentials(groupId: string): boolean {
  if (!groupId || typeof window === 'undefined') return false;
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const hashToken = hashParams.get('t');
  const adminHashToken = hashParams.get('a');
  if (hashToken) saveGroup({ id: groupId, accessToken: hashToken });
  if (adminHashToken) saveGroup({ id: groupId, adminToken: adminHashToken });
  return Boolean(hashToken || adminHashToken);
}

export function useGroupSession(
  groupId: string,
  group: GroupDto | undefined,
  groupError: unknown
) {
  const queryClient = useQueryClient();

  // Handle hash tokens (#t and #link) on initial mount or groupId change
  useEffect(() => {
    if (!groupId) return;

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const adminHashToken = hashParams.get('a');
    const linkCode = hashParams.get('link');

    const savedNow = saveHashCredentials(groupId);

    if (adminHashToken) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    // A load that ran without credentials cached a 404; reset clears that error and refetches.
    if (savedNow && queryClient.getQueryState(groupKeys.detail(groupId))?.status === 'error') {
      queryClient.resetQueries({ queryKey: groupKeys.detail(groupId) });
    }

    if (linkCode) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      if (getGroupCredentials(groupId)?.memberToken) {
        toast.info('Este aparelho já está conectado a este grupo.');
      } else {
        api.redeemLinkCode(groupId, linkCode, describeThisDevice())
          .then((res) => {
            saveGroup({ id: groupId, memberToken: res.memberToken, memberId: res.member.id });
            toast.success(`Aparelho conectado como ${res.member.name}.`);
            return queryClient.invalidateQueries({ queryKey: groupKeys.all });
          })
          .catch((err: unknown) => {
            toast.error(err instanceof ApiError ? err.message : 'Não foi possível conectar este aparelho.');
          });
      }
    }
  }, [groupId, queryClient]);

  // Sync group metadata with local storage
  useEffect(() => {
    if (group) {
      saveGroup({
        id: group.id,
        name: group.name,
        accessToken: group.accessToken ?? undefined,
        adminToken: group.adminToken ?? undefined,
      });
    }
  }, [group]);

  // Keep the open group in sync with changes made from other devices (totals, members, expenses).
  useEffect(() => {
    if (!groupId) return;
    const refreshGroup = () => {
      if (document.visibilityState !== 'visible') return;
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.expenses(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.settlements(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.balances(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.stats(groupId) });
    };
    const interval = window.setInterval(refreshGroup, LIVE_REFRESH_MS);
    document.addEventListener('visibilitychange', refreshGroup);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshGroup);
    };
  }, [groupId, queryClient]);

  // A call made with a stale personal token already dropped it; reload so the identity picker shows up.
  useEffect(() => {
    if (!groupId) return;
    const onIdentityLost = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== groupId) return;
      void queryClient.invalidateQueries({ queryKey: groupKeys.all });
    };
    window.addEventListener(IDENTITY_LOST_EVENT, onIdentityLost);
    return () => window.removeEventListener(IDENTITY_LOST_EVENT, onIdentityLost);
  }, [groupId, queryClient]);

  // Clean stale member token if group yields 404
  useEffect(() => {
    if (
      groupId &&
      groupError instanceof ApiError &&
      groupError.status === 404 &&
      getGroupCredentials(groupId)?.memberToken
    ) {
      forgetMemberIdentity(groupId);
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    }
  }, [groupId, groupError, queryClient]);
}
