import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import {
  api,
  type ApiError,
  type GroupLookupItem,
  type MyGroupDto,
  type GroupDto,
  type CreateGroupRequest,
  type UpdateGroupRequest,
  type ClaimRequest,
  type ClaimResultDto,
  type LinkCodeDto,
  type DeviceDto,
  type MemberRequest,
  type MemberDto,
  type MemberPixDto,
  type ExpenseDto,
  type CreateExpenseRequest,
  type UpdateExpenseRequest,
  type ConfirmationStatus,
  type SettlementDto,
  type CreateSettlementRequest,
  type BalanceDto,
  type StatsDto,
} from '@/lib/api';
import { groupKeys, type ExpenseFilters, type StatsFilters } from './keys';

// ================= Queries =================

export function useLookupGroups(
  items: GroupLookupItem[],
  options?: Omit<UseQueryOptions<MyGroupDto[], ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<MyGroupDto[], ApiError>({
    queryKey: groupKeys.lookup(items),
    queryFn: () => api.lookupGroups(items),
    enabled: Boolean(items && items.length > 0),
    ...options,
  });
}

export function useGroup(
  id: string,
  options?: Omit<UseQueryOptions<GroupDto, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<GroupDto, ApiError>({
    queryKey: groupKeys.detail(id),
    queryFn: () => api.getGroup(id),
    enabled: Boolean(id),
    ...options,
  });
}

export function useDevices(
  groupId: string,
  options?: Omit<UseQueryOptions<DeviceDto[], ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<DeviceDto[], ApiError>({
    queryKey: groupKeys.devicesList(groupId),
    queryFn: () => api.listDevices(groupId),
    enabled: Boolean(groupId),
    ...options,
  });
}

export function useMemberPix(
  groupId: string,
  memberId: string,
  amount: number,
  options?: Omit<UseQueryOptions<MemberPixDto, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<MemberPixDto, ApiError>({
    queryKey: groupKeys.memberPix(groupId, memberId, amount),
    queryFn: () => api.getMemberPix(groupId, memberId, amount),
    enabled: Boolean(groupId && memberId && amount > 0),
    ...options,
  });
}

export function useExpenses(
  groupId: string,
  filters?: ExpenseFilters,
  options?: Omit<UseQueryOptions<ExpenseDto[], ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<ExpenseDto[], ApiError>({
    queryKey: groupKeys.expenses(groupId, filters),
    queryFn: () => api.getExpenses(groupId, filters),
    enabled: Boolean(groupId),
    ...options,
  });
}

export function useExpense(
  groupId: string,
  expenseId: string,
  options?: Omit<UseQueryOptions<ExpenseDto, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<ExpenseDto, ApiError>({
    queryKey: groupKeys.expense(groupId, expenseId),
    queryFn: () => api.getExpense(groupId, expenseId),
    enabled: Boolean(groupId && expenseId),
    ...options,
  });
}

export function useSettlements(
  groupId: string,
  options?: Omit<UseQueryOptions<SettlementDto[], ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<SettlementDto[], ApiError>({
    queryKey: groupKeys.settlements(groupId),
    queryFn: () => api.getSettlements(groupId),
    enabled: Boolean(groupId),
    ...options,
  });
}

export function useBalances(
  groupId: string,
  options?: Omit<UseQueryOptions<BalanceDto, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<BalanceDto, ApiError>({
    queryKey: groupKeys.balances(groupId),
    queryFn: () => api.getBalances(groupId),
    enabled: Boolean(groupId),
    ...options,
  });
}

export function useStats(
  groupId: string,
  filters?: StatsFilters,
  options?: Omit<UseQueryOptions<StatsDto, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<StatsDto, ApiError>({
    queryKey: groupKeys.stats(groupId, filters),
    queryFn: () => api.getStats(groupId, filters),
    enabled: Boolean(groupId),
    ...options,
  });
}

// ================= Mutations =================

export function useCreateGroup(
  options?: UseMutationOptions<GroupDto, ApiError, CreateGroupRequest>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation<GroupDto, ApiError, CreateGroupRequest>({
    mutationFn: (data: CreateGroupRequest) => api.createGroup(data),
    ...rest,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: groupKeys.all });
      return onSuccess?.(...args);
    },
  });
}

export function useUpdateGroup(
  options?: UseMutationOptions<GroupDto, ApiError, { id: string; data: UpdateGroupRequest }>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation<GroupDto, ApiError, { id: string; data: UpdateGroupRequest }>({
    mutationFn: ({ id, data }) => api.updateGroup(id, data),
    ...rest,
    onSuccess: async (...args) => {
      const [, variables] = args;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: groupKeys.detail(variables.id) }),
        queryClient.invalidateQueries({ queryKey: groupKeys.lookups() }),
      ]);
      return onSuccess?.(...args);
    },
  });
}

export function useDeleteGroup(
  options?: UseMutationOptions<void, ApiError, string>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation<void, ApiError, string>({
    mutationFn: (id: string) => api.deleteGroup(id),
    ...rest,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: groupKeys.all });
      return onSuccess?.(...args);
    },
  });
}

export function useClaimMember(
  options?: UseMutationOptions<ClaimResultDto, ApiError, { groupId: string; data: ClaimRequest }>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation<ClaimResultDto, ApiError, { groupId: string; data: ClaimRequest }>({
    mutationFn: ({ groupId, data }) => api.claimMember(groupId, data),
    ...rest,
    onSuccess: async (...args) => {
      const [, variables] = args;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: groupKeys.detail(variables.groupId) }),
        queryClient.invalidateQueries({ queryKey: groupKeys.devicesList(variables.groupId) }),
        queryClient.invalidateQueries({ queryKey: groupKeys.lookups() }),
      ]);
      return onSuccess?.(...args);
    },
  });
}

export function useCreateLinkCode(
  options?: UseMutationOptions<LinkCodeDto, ApiError, string>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation<LinkCodeDto, ApiError, string>({
    mutationFn: (groupId: string) => api.createLinkCode(groupId),
    ...rest,
    onSuccess: async (...args) => {
      const [, variables] = args;
      await queryClient.invalidateQueries({ queryKey: groupKeys.devicesList(variables) });
      return onSuccess?.(...args);
    },
  });
}

export function useRedeemLinkCode(
  options?: UseMutationOptions<
    ClaimResultDto,
    ApiError,
    { groupId: string; code: string; label?: string }
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation<
    ClaimResultDto,
    ApiError,
    { groupId: string; code: string; label?: string }
  >({
    mutationFn: ({ groupId, code, label }) => api.redeemLinkCode(groupId, code, label),
    ...rest,
    onSuccess: async (...args) => {
      const [, variables] = args;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: groupKeys.detail(variables.groupId) }),
        queryClient.invalidateQueries({ queryKey: groupKeys.devicesList(variables.groupId) }),
        queryClient.invalidateQueries({ queryKey: groupKeys.lookups() }),
      ]);
      return onSuccess?.(...args);
    },
  });
}

export function useRevokeDevice(
  options?: UseMutationOptions<void, ApiError, { groupId: string; deviceId: string }>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation<void, ApiError, { groupId: string; deviceId: string }>({
    mutationFn: ({ groupId, deviceId }) => api.revokeDevice(groupId, deviceId),
    ...rest,
    onSuccess: async (...args) => {
      const [, variables] = args;
      await queryClient.invalidateQueries({ queryKey: groupKeys.devicesList(variables.groupId) });
      return onSuccess?.(...args);
    },
  });
}

export function useRotateInvite(
  options?: UseMutationOptions<{ accessToken: string }, ApiError, string>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation<{ accessToken: string }, ApiError, string>({
    mutationFn: (groupId: string) => api.rotateInvite(groupId),
    ...rest,
    onSuccess: async (...args) => {
      const [, variables] = args;
      await queryClient.invalidateQueries({ queryKey: groupKeys.detail(variables) });
      return onSuccess?.(...args);
    },
  });
}

export function useResetMemberClaim(
  options?: UseMutationOptions<void, ApiError, { groupId: string; memberId: string }>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation<void, ApiError, { groupId: string; memberId: string }>({
    mutationFn: ({ groupId, memberId }) => api.resetMemberClaim(groupId, memberId),
    ...rest,
    onSuccess: async (...args) => {
      const [, variables] = args;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: groupKeys.detail(variables.groupId) }),
        queryClient.invalidateQueries({ queryKey: groupKeys.devicesList(variables.groupId) }),
      ]);
      return onSuccess?.(...args);
    },
  });
}

export function useAddMember(
  options?: UseMutationOptions<MemberDto, ApiError, { groupId: string; data: MemberRequest }>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation<MemberDto, ApiError, { groupId: string; data: MemberRequest }>({
    mutationFn: ({ groupId, data }) => api.addMember(groupId, data),
    ...rest,
    onSuccess: async (...args) => {
      const [, variables] = args;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: groupKeys.detail(variables.groupId) }),
        queryClient.invalidateQueries({ queryKey: groupKeys.balances(variables.groupId) }),
        queryClient.invalidateQueries({ queryKey: groupKeys.stats(variables.groupId) }),
      ]);
      return onSuccess?.(...args);
    },
  });
}

export function useUpdateMember(
  options?: UseMutationOptions<
    MemberDto,
    ApiError,
    { groupId: string; memberId: string; data: MemberRequest }
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation<
    MemberDto,
    ApiError,
    { groupId: string; memberId: string; data: MemberRequest }
  >({
    mutationFn: ({ groupId, memberId, data }) => api.updateMember(groupId, memberId, data),
    ...rest,
    onSuccess: async (...args) => {
      const [, variables] = args;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: groupKeys.detail(variables.groupId) }),
        queryClient.invalidateQueries({ queryKey: groupKeys.balances(variables.groupId) }),
        queryClient.invalidateQueries({ queryKey: groupKeys.stats(variables.groupId) }),
      ]);
      return onSuccess?.(...args);
    },
  });
}

export function useDeleteMember(
  options?: UseMutationOptions<void, ApiError, { groupId: string; memberId: string }>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation<void, ApiError, { groupId: string; memberId: string }>({
    mutationFn: ({ groupId, memberId }) => api.deleteMember(groupId, memberId),
    ...rest,
    onSuccess: async (...args) => {
      const [, variables] = args;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: groupKeys.detail(variables.groupId) }),
        queryClient.invalidateQueries({ queryKey: groupKeys.balances(variables.groupId) }),
        queryClient.invalidateQueries({ queryKey: groupKeys.stats(variables.groupId) }),
      ]);
      return onSuccess?.(...args);
    },
  });
}

export function useCreateExpense(
  options?: UseMutationOptions<
    ExpenseDto,
    ApiError,
    { groupId: string; data: CreateExpenseRequest }
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation<
    ExpenseDto,
    ApiError,
    { groupId: string; data: CreateExpenseRequest }
  >({
    mutationFn: ({ groupId, data }) => api.createExpense(groupId, data),
    ...rest,
    onSuccess: async (...args) => {
      const [, variables] = args;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: groupKeys.expenses(variables.groupId) }),
        queryClient.invalidateQueries({ queryKey: groupKeys.balances(variables.groupId) }),
        queryClient.invalidateQueries({ queryKey: groupKeys.stats(variables.groupId) }),
        queryClient.invalidateQueries({ queryKey: groupKeys.detail(variables.groupId) }),
        queryClient.invalidateQueries({ queryKey: groupKeys.lookups() }),
      ]);
      return onSuccess?.(...args);
    },
  });
}

export function useUpdateExpense(
  options?: UseMutationOptions<
    ExpenseDto,
    ApiError,
    { groupId: string; expenseId: string; data: UpdateExpenseRequest }
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation<
    ExpenseDto,
    ApiError,
    { groupId: string; expenseId: string; data: UpdateExpenseRequest }
  >({
    mutationFn: ({ groupId, expenseId, data }) => api.updateExpense(groupId, expenseId, data),
    ...rest,
    onSuccess: async (...args) => {
      const [, variables] = args;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: groupKeys.expenses(variables.groupId) }),
        queryClient.invalidateQueries({
          queryKey: groupKeys.expense(variables.groupId, variables.expenseId),
        }),
        queryClient.invalidateQueries({ queryKey: groupKeys.balances(variables.groupId) }),
        queryClient.invalidateQueries({ queryKey: groupKeys.stats(variables.groupId) }),
        queryClient.invalidateQueries({ queryKey: groupKeys.detail(variables.groupId) }),
        queryClient.invalidateQueries({ queryKey: groupKeys.lookups() }),
      ]);
      return onSuccess?.(...args);
    },
  });
}

export function useConfirmExpense(
  options?: UseMutationOptions<
    ExpenseDto,
    ApiError,
    {
      groupId: string;
      expenseId: string;
      data: { status: ConfirmationStatus; comment?: string | null };
    }
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation<
    ExpenseDto,
    ApiError,
    {
      groupId: string;
      expenseId: string;
      data: { status: ConfirmationStatus; comment?: string | null };
    }
  >({
    mutationFn: ({ groupId, expenseId, data }) => api.confirmExpense(groupId, expenseId, data),
    ...rest,
    onSuccess: async (...args) => {
      const [, variables] = args;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: groupKeys.expenses(variables.groupId) }),
        queryClient.invalidateQueries({
          queryKey: groupKeys.expense(variables.groupId, variables.expenseId),
        }),
        queryClient.invalidateQueries({ queryKey: groupKeys.balances(variables.groupId) }),
        queryClient.invalidateQueries({ queryKey: groupKeys.stats(variables.groupId) }),
      ]);
      return onSuccess?.(...args);
    },
  });
}

export function useDeleteExpense(
  options?: UseMutationOptions<void, ApiError, { groupId: string; expenseId: string }>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation<void, ApiError, { groupId: string; expenseId: string }>({
    mutationFn: ({ groupId, expenseId }) => api.deleteExpense(groupId, expenseId),
    ...rest,
    onSuccess: async (...args) => {
      const [, variables] = args;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: groupKeys.expenses(variables.groupId) }),
        queryClient.invalidateQueries({
          queryKey: groupKeys.expense(variables.groupId, variables.expenseId),
        }),
        queryClient.invalidateQueries({ queryKey: groupKeys.balances(variables.groupId) }),
        queryClient.invalidateQueries({ queryKey: groupKeys.stats(variables.groupId) }),
        queryClient.invalidateQueries({ queryKey: groupKeys.detail(variables.groupId) }),
        queryClient.invalidateQueries({ queryKey: groupKeys.lookups() }),
      ]);
      return onSuccess?.(...args);
    },
  });
}

export function useCreateSettlement(
  options?: UseMutationOptions<
    SettlementDto,
    ApiError,
    { groupId: string; data: CreateSettlementRequest }
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation<
    SettlementDto,
    ApiError,
    { groupId: string; data: CreateSettlementRequest }
  >({
    mutationFn: ({ groupId, data }) => api.createSettlement(groupId, data),
    ...rest,
    onSuccess: async (...args) => {
      const [, variables] = args;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: groupKeys.settlements(variables.groupId) }),
        queryClient.invalidateQueries({ queryKey: groupKeys.balances(variables.groupId) }),
        queryClient.invalidateQueries({ queryKey: groupKeys.stats(variables.groupId) }),
      ]);
      return onSuccess?.(...args);
    },
  });
}

export function useConfirmSettlement(
  options?: UseMutationOptions<
    SettlementDto,
    ApiError,
    { groupId: string; settlementId: string }
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation<
    SettlementDto,
    ApiError,
    { groupId: string; settlementId: string }
  >({
    mutationFn: ({ groupId, settlementId }) => api.confirmSettlement(groupId, settlementId),
    ...rest,
    onSuccess: async (...args) => {
      const [, variables] = args;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: groupKeys.settlements(variables.groupId) }),
        queryClient.invalidateQueries({ queryKey: groupKeys.balances(variables.groupId) }),
        queryClient.invalidateQueries({ queryKey: groupKeys.stats(variables.groupId) }),
      ]);
      return onSuccess?.(...args);
    },
  });
}

export function useDeleteSettlement(
  options?: UseMutationOptions<void, ApiError, { groupId: string; settlementId: string }>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation<void, ApiError, { groupId: string; settlementId: string }>({
    mutationFn: ({ groupId, settlementId }) => api.deleteSettlement(groupId, settlementId),
    ...rest,
    onSuccess: async (...args) => {
      const [, variables] = args;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: groupKeys.settlements(variables.groupId) }),
        queryClient.invalidateQueries({ queryKey: groupKeys.balances(variables.groupId) }),
        queryClient.invalidateQueries({ queryKey: groupKeys.stats(variables.groupId) }),
      ]);
      return onSuccess?.(...args);
    },
  });
}
