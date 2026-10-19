'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  api,
  ApiError,
  SplitParticipantPixDto,
  SplitParticipantPublicDto,
  SplitPublicDto,
} from '@/lib/api';
import { formatBRL, formatDate } from '@/lib/formatters';
import { Money } from '@/components/ui/Money';
import { getSavedSplitToken } from '@/lib/storage';
import { splitAdminPath } from '@/lib/routes';
import {
  PixQrModal,
  StatusPill,
  PaidProgress,
} from '@/components/splits/PixQrModal';
import { CopyButton } from '@/components/ui/CopyButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { Share2 } from 'lucide-react';
import { useTermsAccepted, TermsConsentCheckbox, TermsShortNotice } from '@/components/TermsConsent';

function PageSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-12 w-full space-y-6" aria-busy="true">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4 shadow-sm">
        <Skeleton className="h-8 w-2/3 rounded-lg" />
        <Skeleton className="h-4 w-1/3 rounded-md" />
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-36 rounded-lg" />
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 overflow-hidden divide-y divide-zinc-800/60 shadow-sm">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-3 w-16 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-10 w-28 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PublicSplitContent() {
  const slug = useSearchParams().get('slug') ?? '';

  const [split, setSplit] = useState<SplitPublicDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected participant for Pix
  const [selectedParticipant, setSelectedParticipant] =
    useState<SplitParticipantPublicDto | null>(null);
  const [pixData, setPixData] = useState<SplitParticipantPixDto | null>(null);
  const [loadingPix, setLoadingPix] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [ownerNotice, setOwnerNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Admin token if stored in local storage
  const [savedToken, setSavedToken] = useState<string | null>(null);
  const { accepted: termsAccepted } = useTermsAccepted();

  const fetchSplit = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getSplitPublic(slug);
      setSplit(data);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Não foi possível carregar as informações deste racha.');
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchSplit();
    const token = getSavedSplitToken(slug);
    setSavedToken(token);
  }, [slug, fetchSplit]);

  const handleSelectParticipant = async (p: SplitParticipantPublicDto) => {
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
      const data = await api.getParticipantPix(slug, p.id);
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
  };

  const handleMarkPaid = async () => {
    if (!selectedParticipant || !split) return;
    try {
      setMarkingPaid(true);
      setActionError(null);
      const updated = await api.markPaid(slug, selectedParticipant.id);
      setSplit(updated);
      // update local selected participant
      setSelectedParticipant((prev) => (prev ? { ...prev, paymentPending: !prev.paid } : null));
      toast.success('Organizador avisado do seu pagamento');
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Falha ao marcar como pago.';
      setActionError(msg);
      toast.error(msg);
    } finally {
      setMarkingPaid(false);
    }
  };

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  if (loading && !split) {
    return <PageSkeleton />;
  }

  if (error || !split) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center animate-fade-up">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 space-y-4 shadow-sm backdrop-blur-sm">
          <h1 className="text-xl font-semibold text-zinc-50">
            Conta não encontrada
          </h1>
          <p className="text-zinc-400 text-sm">
            {error || 'Não encontramos nenhuma conta com o código informado.'}
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center min-h-11 px-5 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 rounded-xl text-sm font-medium transition active:scale-[0.98]"
            >
              Voltar ao início
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const progressPct =
    split.totalAmount > 0
      ? Math.min(100, Math.round((split.paidAmount / split.totalAmount) * 100))
      : 0;

  const isOverdue =
    new Date().getTime() - new Date(split.createdAt).getTime() > 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-12 w-full space-y-6 animate-fade-up">
      <header className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6 space-y-5 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-50 break-words">
              {split.title}
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              {split.receiverName} &middot; {formatDate(split.createdAt)}
            </p>
          </div>
          <div className="sm:text-right shrink-0">
            <Money value={split.totalAmount} className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-50" />
          </div>
        </div>

        <div className="space-y-2">
          <PaidProgress paid={split.paidCount} total={split.participants.length} pct={progressPct} />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-zinc-400">
            <span>
              Recebido <Money value={split.paidAmount} className="font-semibold text-zinc-200" /> ({progressPct}%)
            </span>
            {split.pendingCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-amber-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                {split.pendingCount} aguardando confirmação
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/60">
          <CopyButton
            text={pageUrl}
            label="Copiar link"
            copiedLabel="Link copiado"
            size="sm"
          />
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              type="button"
              onClick={() =>
                navigator.share?.({
                  title: split.title,
                  text: `Racha de conta: ${split.title} (${formatBRL(split.totalAmount)})`,
                  url: pageUrl,
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 min-h-11 text-sm rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 font-medium transition active:scale-[0.98] cursor-pointer"
            >
              <Share2 className="w-4 h-4" /> Compartilhar
            </button>
          )}
          {savedToken && (
            <Link
              href={splitAdminPath(split.slug, savedToken)}
              className="ml-auto text-sm font-medium text-accent hover:text-accent-hover min-h-11 flex items-center transition"
            >
              Painel do organizador &rarr;
            </Link>
          )}
        </div>
      </header>

      {actionError && (
        <div role="alert" className="p-4 rounded-xl border border-rose-800/80 bg-rose-950/20 text-rose-300 text-sm flex items-center justify-between gap-3 animate-fade-in">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-sm font-medium hover:underline cursor-pointer min-h-11 px-2"
          >
            Fechar
          </button>
        </div>
      )}

      {ownerNotice && (
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 text-sm text-zinc-300 flex items-center gap-2.5 animate-fade-in">
          <p>{ownerNotice}</p>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base sm:text-lg font-semibold text-zinc-50">Selecione seu nome</h2>
          <span className="text-xs text-zinc-400 font-medium">{split.participants.length} participantes</span>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2.5">
          <TermsShortNotice />
          <TermsConsentCheckbox id="split-terms-consent" />
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 divide-y divide-zinc-800/60 overflow-hidden shadow-sm backdrop-blur-sm">
          {split.participants.map((p) => {
            const initial = p.name.trim().charAt(0).toUpperCase();
            return (
              <div
                key={p.id}
                className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-800/20 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-xs font-semibold text-zinc-200 shrink-0 select-none"
                    aria-hidden="true"
                  >
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-zinc-100 break-words flex items-center gap-1.5 flex-wrap">
                      <span>{p.name}</span>
                      {p.isOwner && (
                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-400">
                          organizador
                        </span>
                      )}
                    </p>
                    <div className="mt-1">
                      {p.paid ? (
                        <StatusPill status="paid" />
                      ) : p.paymentPending ? (
                        <StatusPill status="pending" label="Aguardando confirmação" />
                      ) : isOverdue ? (
                        <StatusPill status="overdue" />
                      ) : (
                        <StatusPill status="pending" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-0 border-zinc-800/40">
                  <Money
                    value={p.amount}
                    className={`text-base font-semibold tabular-nums text-right ${p.paid ? 'text-emerald-400' : 'text-zinc-50'}`}
                  />
                  <button
                    type="button"
                    disabled={loadingPix || (!p.paid && !termsAccepted)}
                    onClick={() => handleSelectParticipant(p)}
                    className={`px-3.5 min-h-11 rounded-xl text-xs sm:text-sm font-semibold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${
                      p.paid
                        ? 'border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300'
                        : p.paymentPending
                          ? 'border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300'
                          : 'bg-accent hover:bg-accent-hover text-accent-fg shadow-sm'
                    }`}
                  >
                    {p.paid ? 'Ver comprovante' : p.paymentPending ? 'Ver Pix' : 'Pagar minha parte'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pix QR Modal when participant selected */}
      {selectedParticipant && pixData && (
        <PixQrModal
          isOpen={!!selectedParticipant && !selectedParticipant.isOwner}
          onClose={() => {
            setSelectedParticipant(null);
            setPixData(null);
          }}
          receiverName={pixData.receiverName}
          amount={pixData.amount}
          pixCode={pixData.pixCode}
          pixKey={pixData.pixKey}
          isPaid={selectedParticipant.paid}
          isPending={selectedParticipant.paymentPending}
          onMarkPaid={handleMarkPaid}
          isMarkingPaid={markingPaid}
          splitTitle={split.title}
          payerName={selectedParticipant.name}
          participantId={selectedParticipant.id}
        />
      )}
    </div>
  );
}

export default function PublicSplitPage() {
  return (
    <React.Suspense fallback={<PageSkeleton />}>
      <PublicSplitContent />
    </React.Suspense>
  );
}
