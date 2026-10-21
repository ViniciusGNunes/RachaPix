'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  api,
  ApiError,
  type SplitParticipantPixDto,
  type SplitParticipantPublicDto,
} from '@/lib/api';
import { getSavedSplitToken } from '@/lib/storage';
import { isOverdueSince } from '@/lib/formatters';
import { toast } from '@/components/ui/Toast';
import { useTermsAccepted } from '@/components/TermsConsent';
import { useSplitPublic, useMarkPaid, splitKeys } from '@/lib/query';

export function useSplitPublicPage() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug') ?? '';
  const queryClient = useQueryClient();

  const {
    data: split,
    isLoading: loading,
    error: queryError,
  } = useSplitPublic(slug);

  const markPaidMutation = useMarkPaid();

  const [selectedParticipant, setSelectedParticipant] =
    useState<SplitParticipantPublicDto | null>(null);
  const [pixData, setPixData] = useState<SplitParticipantPixDto | null>(null);
  const [loadingPix, setLoadingPix] = useState(false);
  const [ownerNotice, setOwnerNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [savedToken, setSavedToken] = useState<string | null>(null);

  const { accepted: termsAccepted } = useTermsAccepted();

  useEffect(() => {
    if (!slug) return;
    const token = getSavedSplitToken(slug);
    setSavedToken(token);
  }, [slug]);

  const handleSelectParticipant = useCallback(
    async (p: SplitParticipantPublicDto) => {
      setOwnerNotice(null);
      setActionError(null);

      if (!p.paid && !termsAccepted) {
        toast.error('Aceite os Termos de Uso e a Política de Privacidade para visualizar o Pix.');
        return;
      }

      setSelectedParticipant(p);

      if (p.isOwner) {
        setOwnerNotice('Você é o organizador desta conta. Sua parte já está confirmada!');
        return;
      }

      try {
        setLoadingPix(true);
        const data = await queryClient.fetchQuery({
          queryKey: splitKeys.participantPix(slug, p.id),
          queryFn: () => api.getParticipantPix(slug, p.id),
          staleTime: 1000 * 60,
        });
        setPixData(data);
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 404) {
          setOwnerNotice('Você é o organizador desta conta.');
        } else {
          setActionError('Erro ao carregar dados do Pix. Tente novamente.');
          toast.error('Erro ao carregar dados do Pix. Tente novamente.');
        }
      } finally {
        setLoadingPix(false);
      }
    },
    [slug, termsAccepted, queryClient]
  );

  const handleMarkPaid = useCallback(async () => {
    if (!selectedParticipant || !split) return;
    try {
      setActionError(null);
      await markPaidMutation.mutateAsync({ slug, participantId: selectedParticipant.id });
      setSelectedParticipant((prev) => (prev ? { ...prev, paymentPending: !prev.paid } : null));
      toast.success('Organizador avisado do seu pagamento');
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Falha ao marcar como pago.';
      setActionError(msg);
      toast.error(msg);
    }
  }, [selectedParticipant, split, slug, markPaidMutation]);

  const handleClosePixModal = useCallback(() => {
    setSelectedParticipant(null);
    setPixData(null);
  }, []);

  const clearActionError = useCallback(() => {
    setActionError(null);
  }, []);

  const progressPct = useMemo(() => {
    if (!split || split.totalAmount <= 0) return 0;
    return Math.min(100, Math.round((split.paidAmount / split.totalAmount) * 100));
  }, [split]);

  const isOverdue = useMemo(() => {
    return split ? isOverdueSince(split.createdAt) : false;
  }, [split]);

  const errorMessage = queryError
    ? queryError instanceof ApiError
      ? queryError.message
      : 'Não foi possível carregar as informações deste racha.'
    : null;

  return {
    slug,
    split: split ?? null,
    loading,
    error: errorMessage,
    savedToken,
    selectedParticipant,
    pixData,
    loadingPix,
    markingPaid: markPaidMutation.isPending,
    ownerNotice,
    actionError,
    progressPct,
    isOverdue,
    termsAccepted,
    handleSelectParticipant,
    handleMarkPaid,
    handleClosePixModal,
    clearActionError,
  };
}
