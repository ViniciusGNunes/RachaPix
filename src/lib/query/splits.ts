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
  type CreateSplitRequest,
  type SplitPublicDto,
  type SplitAdminDto,
  type SplitParticipantPixDto,
} from '@/lib/api';
import { splitKeys } from './keys';

export function useSplitPublic(
  slug: string,
  options?: Omit<UseQueryOptions<SplitPublicDto, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<SplitPublicDto, ApiError>({
    queryKey: splitKeys.public(slug),
    queryFn: () => api.getSplitPublic(slug),
    enabled: Boolean(slug),
    ...options,
  });
}

export function useSplitAdmin(
  slug: string,
  token: string,
  options?: Omit<UseQueryOptions<SplitAdminDto, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<SplitAdminDto, ApiError>({
    queryKey: splitKeys.admin(slug, token),
    queryFn: () => api.getSplitAdmin(slug, token),
    enabled: Boolean(slug && token),
    ...options,
  });
}

export function useParticipantPix(
  slug: string,
  participantId: string,
  options?: Omit<UseQueryOptions<SplitParticipantPixDto, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<SplitParticipantPixDto, ApiError>({
    queryKey: splitKeys.participantPix(slug, participantId),
    queryFn: () => api.getParticipantPix(slug, participantId),
    enabled: Boolean(slug && participantId),
    ...options,
  });
}

export function useCreateSplit(
  options?: UseMutationOptions<SplitAdminDto, ApiError, CreateSplitRequest>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation<SplitAdminDto, ApiError, CreateSplitRequest>({
    mutationFn: (data: CreateSplitRequest) => api.createSplit(data),
    ...rest,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: splitKeys.all });
      return onSuccess?.(...args);
    },
  });
}

export function useMarkPaid(
  options?: UseMutationOptions<SplitPublicDto, ApiError, { slug: string; participantId: string }>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation<SplitPublicDto, ApiError, { slug: string; participantId: string }>({
    mutationFn: ({ slug, participantId }) => api.markPaid(slug, participantId),
    ...rest,
    onSuccess: async (...args) => {
      const [, variables] = args;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: splitKeys.public(variables.slug) }),
        queryClient.invalidateQueries({ queryKey: splitKeys.all }),
      ]);
      return onSuccess?.(...args);
    },
  });
}

export function useRejectClaimAdmin(
  options?: UseMutationOptions<
    SplitAdminDto,
    ApiError,
    { slug: string; participantId: string; token: string }
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation<
    SplitAdminDto,
    ApiError,
    { slug: string; participantId: string; token: string }
  >({
    mutationFn: ({ slug, participantId, token }) =>
      api.rejectClaimAdmin(slug, participantId, token),
    ...rest,
    onSuccess: async (...args) => {
      const [, variables] = args;
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: splitKeys.admin(variables.slug, variables.token),
        }),
        queryClient.invalidateQueries({ queryKey: splitKeys.public(variables.slug) }),
      ]);
      return onSuccess?.(...args);
    },
  });
}

export function useTogglePaidAdmin(
  options?: UseMutationOptions<
    SplitAdminDto,
    ApiError,
    { slug: string; participantId: string; token: string }
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation<
    SplitAdminDto,
    ApiError,
    { slug: string; participantId: string; token: string }
  >({
    mutationFn: ({ slug, participantId, token }) =>
      api.togglePaidAdmin(slug, participantId, token),
    ...rest,
    onSuccess: async (...args) => {
      const [, variables] = args;
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: splitKeys.admin(variables.slug, variables.token),
        }),
        queryClient.invalidateQueries({ queryKey: splitKeys.public(variables.slug) }),
      ]);
      return onSuccess?.(...args);
    },
  });
}

export function useDeleteSplit(
  options?: UseMutationOptions<void, ApiError, { slug: string; token: string }>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation<void, ApiError, { slug: string; token: string }>({
    mutationFn: ({ slug, token }) => api.deleteSplit(slug, token),
    ...rest,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: splitKeys.all });
      return onSuccess?.(...args);
    },
  });
}
