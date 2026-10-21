'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { isOverdueSince } from '@/lib/formatters';
import { getSavedSplitToken, removeSavedSplit, saveSplit } from '@/lib/storage';
import { absoluteUrl, splitAdminPath, splitPath } from '@/lib/routes';
import { toast } from '@/components/ui/Toast';
import {
  useSplitAdmin,
  useRejectClaimAdmin,
  useTogglePaidAdmin,
  useDeleteSplit,
} from '@/lib/query';

export function useSplitAdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug') ?? '';
  const tokenFromQuery = searchParams.get('token');

  const [token, setToken] = useState<string>(tokenFromQuery || '');
  const [inputToken, setInputToken] = useState<string>('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Initialize token from query or storage
  useEffect(() => {
    if (tokenFromQuery) {
      setToken(tokenFromQuery);
      saveSplit({
        slug,
        adminToken: tokenFromQuery,
        title: 'Racha',
        createdAt: new Date().toISOString(),
      });
    } else {
      const stored = getSavedSplitToken(slug);
      if (stored) {
        setToken(stored);
      }
    }
  }, [slug, tokenFromQuery]);

  const {
    data: split,
    isLoading,
    isFetching,
    error: queryError,
  } = useSplitAdmin(slug, token, {
    refetchInterval: token ? 10000 : false,
    enabled: Boolean(slug && token),
  });

  // When split is loaded with tokenFromQuery, update stored title
  useEffect(() => {
    if (split?.title && tokenFromQuery) {
      saveSplit({
        slug,
        adminToken: tokenFromQuery,
        title: split.title,
        createdAt: split.createdAt,
      });
    }
  }, [slug, tokenFromQuery, split?.title, split?.createdAt]);

  const rejectClaimMutation = useRejectClaimAdmin();
  const togglePaidMutation = useTogglePaidAdmin();
  const deleteSplitMutation = useDeleteSplit();

  const handleApplyToken = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = inputToken.trim();
    if (!cleanToken) return;
    setToken(cleanToken);
    router.replace(splitAdminPath(slug, cleanToken));
  };

  const handleResetToken = () => {
    setToken('');
    setActionError(null);
  };

  const handleRejectClaim = useCallback(
    async (participantId: string) => {
      if (!token) return;
      setActionError(null);
      try {
        setTogglingId(participantId);
        await rejectClaimMutation.mutateAsync({ slug, participantId, token });
      } catch (err: unknown) {
        const msg = err instanceof ApiError ? err.message : 'Falha ao rejeitar pagamento.';
        setActionError(msg);
        toast.error(msg);
      } finally {
        setTogglingId(null);
      }
    },
    [slug, token, rejectClaimMutation]
  );

  const handleTogglePaid = useCallback(
    async (participantId: string) => {
      if (!token) return;
      setActionError(null);
      try {
        setTogglingId(participantId);
        await togglePaidMutation.mutateAsync({ slug, participantId, token });
      } catch (err: unknown) {
        const msg = err instanceof ApiError ? err.message : 'Falha ao alterar status.';
        setActionError(msg);
        toast.error(msg);
      } finally {
        setTogglingId(null);
      }
    },
    [slug, token, togglePaidMutation]
  );

  const handleDeleteSplit = useCallback(async () => {
    if (!token) return;
    setActionError(null);
    try {
      setIsDeleting(true);
      await deleteSplitMutation.mutateAsync({ slug, token });
      removeSavedSplit(slug);
      router.push('/');
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Falha ao excluir o racha.';
      setActionError(msg);
      toast.error(msg);
      setIsDeleting(false);
    }
  }, [slug, token, deleteSplitMutation, router]);

  const progressPct = useMemo(() => {
    if (!split || split.totalAmount <= 0) return 0;
    return Math.min(100, Math.round((split.paidAmount / split.totalAmount) * 100));
  }, [split]);

  const isOverdue = useMemo(() => {
    return split ? isOverdueSince(split.createdAt) : false;
  }, [split]);

  const publicUrl = useMemo(() => absoluteUrl(splitPath(slug)), [slug]);

  let errorMessage: string | null = null;
  if (queryError) {
    if (queryError instanceof ApiError && queryError.status === 403) {
      errorMessage = 'Token de administrador inválido ou expirado.';
    } else {
      errorMessage = queryError.message || 'Erro ao carregar painel administrativo.';
    }
  }

  return {
    slug,
    token,
    inputToken,
    setInputToken,
    split: split ?? null,
    loading: isLoading && !split,
    refreshing: isFetching && !isLoading,
    error: errorMessage,
    togglingId,
    deleteModalOpen,
    setDeleteModalOpen,
    isDeleting,
    actionError,
    setActionError,
    progressPct,
    isOverdue,
    publicUrl,
    handleApplyToken,
    handleResetToken,
    handleRejectClaim,
    handleTogglePaid,
    handleDeleteSplit,
  };
}
