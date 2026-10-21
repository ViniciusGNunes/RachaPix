import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, ApiError, type GroupDto } from '@/lib/api';
import { describeThisDevice } from '@/lib/device';
import { groupKeys } from '@/lib/query';
import {
  forgetMemberIdentity,
  getGroupCredentials,
  saveGroup,
} from '@/lib/storage';
import { toast } from '@/components/ui/Toast';

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
    const hashToken = hashParams.get('t');
    const linkCode = hashParams.get('link');

    if (hashToken) {
      saveGroup({ id: groupId, accessToken: hashToken });
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
