'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  api,
  ApiError,
  SplitAdminDto,
} from '@/lib/api';
import { formatDateTime, isOverdueSince } from '@/lib/formatters';
import { getSavedSplitToken, removeSavedSplit, saveSplit } from '@/lib/storage';
import { absoluteUrl, splitAdminPath, splitPath } from '@/lib/routes';
import { CopyButton } from '@/components/ui/CopyButton';
import { Money } from '@/components/ui/Money';
import { ParticipantStatusPill, PaidProgress } from '@/components/splits/PixQrModal';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';

function AdminSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-12 w-full space-y-6" aria-busy="true">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4 shadow-sm">
        <Skeleton className="h-8 w-2/3 rounded-lg" />
        <Skeleton className="h-4 w-1/2 rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-36 rounded-lg" />
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 overflow-hidden divide-y divide-zinc-800/60 shadow-sm">
          {[0, 1, 2].map((i) => (
            <div key={i} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-28 rounded-md" />
                    <Skeleton className="h-3 w-20 rounded-md" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SplitAdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug') ?? '';

  const tokenFromQuery = searchParams.get('token');
  const [token, setToken] = useState<string>(tokenFromQuery || '');
  const [inputToken, setInputToken] = useState<string>('');

  const [split, setSplit] = useState<SplitAdminDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        title: split?.title || 'Racha',
        createdAt: new Date().toISOString(),
      });
    } else {
      const stored = getSavedSplitToken(slug);
      if (stored) {
        setToken(stored);
      }
    }
  }, [slug, tokenFromQuery, split?.title]);

  const loadAdminData = useCallback(
    async (adminToken: string, isBackground = false) => {
      if (!adminToken) {
        setLoading(false);
        return;
      }
      try {
        if (!isBackground) setLoading(true);
        else setRefreshing(true);
        setError(null);

        const data = await api.getSplitAdmin(slug, adminToken);
        setSplit(data);
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          if (err.status === 403) {
            setError('Token de administrador inválido ou expirado.');
          } else {
            setError(err.message);
          }
        } else {
          setError('Erro ao carregar painel administrativo.');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [slug]
  );

  useEffect(() => {
    if (token) {
      loadAdminData(token);
    } else {
      setLoading(false);
    }
  }, [token, loadAdminData]);

  // Auto-refresh every 10s per contract
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      loadAdminData(token, true);
    }, 10000);
    return () => clearInterval(interval);
  }, [token, loadAdminData]);

  const handleApplyToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken.trim()) return;
    setToken(inputToken.trim());
    router.replace(splitAdminPath(slug, inputToken.trim()));
  };

  const handleRejectClaim = async (participantId: string) => {
    if (!token) return;
    setActionError(null);
    try {
      setTogglingId(participantId);
      const updated = await api.rejectClaimAdmin(slug, participantId, token);
      setSplit(updated);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Falha ao rejeitar pagamento.';
      setActionError(msg);
      toast.error(msg);
    } finally {
      setTogglingId(null);
    }
  };

  const handleTogglePaid = async (participantId: string) => {
    if (!token) return;
    setActionError(null);
    try {
      setTogglingId(participantId);
      const updated = await api.togglePaidAdmin(slug, participantId, token);
      setSplit(updated);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Falha ao alterar status.';
      setActionError(msg);
      toast.error(msg);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteSplit = async () => {
    if (!token) return;
    setActionError(null);
    try {
      setIsDeleting(true);
      await api.deleteSplit(slug, token);
      removeSavedSplit(slug);
      router.push('/');
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Falha ao excluir o racha.';
      setActionError(msg);
      toast.error(msg);
      setIsDeleting(false);
    }
  };

  const publicUrl = absoluteUrl(splitPath(slug));

  // If no token provided yet
  if (!token && !loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 sm:py-24 animate-fade-up">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8 space-y-6 shadow-sm backdrop-blur-sm">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Painel do organizador</h1>
            <p className="text-sm text-zinc-400 mt-2">
              Informe a chave secreta gerada na criação do racha &quot;{slug}&quot;.
            </p>
          </div>

          <form onSubmit={handleApplyToken} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="token-input" className="text-xs font-medium text-zinc-400">
                Token de administrador
              </label>
              <input
                id="token-input"
                type="text"
                required
                placeholder="Cole o token de administrador"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-50 text-sm font-mono focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none placeholder:text-zinc-500"
              />
            </div>
            <button
              type="submit"
              className="w-full h-12 px-4 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg font-semibold text-base transition active:scale-[0.98] cursor-pointer shadow-sm"
            >
              Acessar
            </button>
          </form>

          <div className="pt-2 border-t border-zinc-800/60 text-center">
            <Link
              href={splitPath(slug)}
              className="inline-flex items-center justify-center text-sm font-medium text-zinc-400 hover:text-zinc-200 transition min-h-11"
            >
              Voltar para a página pública
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !split) {
    return <AdminSkeleton />;
  }

  if (error || !split) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center animate-fade-up">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 space-y-4 shadow-sm backdrop-blur-sm">
          <h1 className="text-xl font-bold text-zinc-50">
            Erro de autenticação
          </h1>
          <p className="text-zinc-400 text-sm">{error}</p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setToken('');
                setError(null);
              }}
              className="px-5 min-h-11 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 rounded-xl text-sm font-medium transition active:scale-[0.98] cursor-pointer"
            >
              Inserir outro token
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progressPct =
    split.totalAmount > 0
      ? Math.min(100, Math.round((split.paidAmount / split.totalAmount) * 100))
      : 0;

  const isOverdue = isOverdueSince(split.createdAt);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-12 w-full space-y-6 animate-fade-up">
      {actionError && !deleteModalOpen && (
        <div role="alert" className="border border-rose-800/80 bg-rose-950/20 text-rose-300 p-4 rounded-xl text-sm flex items-start justify-between gap-3 animate-fade-in">
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

      <header className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6 space-y-5 shadow-sm backdrop-blur-sm">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-50 break-words">
              {split.title}
            </h1>
            {refreshing && (
              <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />{' '}
                Atualizando...
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-400">
            Pix de <span className="font-medium text-zinc-200">{split.receiverName}</span> ({split.receiverCity}) &middot; {split.pixKeyType}:{' '}
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 break-all">{split.pixKey}</span>
          </p>
        </div>

        {/* Financial overview stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60">
            <p className="text-xs text-zinc-400 font-medium">Total</p>
            <Money value={split.totalAmount} className="text-lg font-bold text-zinc-100 mt-0.5" />
          </div>
          <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <p className="text-xs text-emerald-400 font-medium">Recebido</p>
            <Money value={split.paidAmount} className="text-lg font-bold text-emerald-400 mt-0.5" />
          </div>
          <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5">
            <p className="text-xs text-amber-400 font-medium">Falta receber</p>
            <Money value={Math.max(0, split.totalAmount - split.paidAmount)} className="text-lg font-bold text-amber-400 mt-0.5" />
          </div>
        </div>

        <div className="space-y-2">
          <PaidProgress paid={split.paidCount} total={split.participants.length} pct={progressPct} />
          {split.pendingCount > 0 && (
            <p className="text-xs sm:text-sm text-amber-400 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              {split.pendingCount} aguardando confirmação
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/60">
          <CopyButton text={publicUrl} label="Copiar link do grupo" variant="primary" size="sm" />
          <Link
            href={splitPath(slug)}
            className="inline-flex items-center px-3.5 min-h-11 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-sm font-medium text-zinc-300 transition active:scale-[0.98]"
          >
            Ver página pública
          </Link>
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className="ml-auto inline-flex items-center px-3 min-h-11 text-xs sm:text-sm font-medium text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
          >
            Excluir racha
          </button>
        </div>
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base sm:text-lg font-semibold text-zinc-50">
            Participantes ({split.participants.length})
          </h2>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 divide-y divide-zinc-800/60 overflow-hidden shadow-sm backdrop-blur-sm">
          {split.participants.map((p) => {
            const initial = p.name.trim().charAt(0).toUpperCase();
            return (
              <div key={p.id} className="p-3.5 sm:p-4 space-y-3 hover:bg-zinc-800/20 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-full bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-xs font-semibold text-zinc-200 shrink-0 select-none mt-0.5"
                      aria-hidden="true"
                    >
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-100 break-words flex items-center gap-1.5 flex-wrap">
                        <span>{p.name}</span>
                        {p.isOwner && (
                          <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-400">
                            organizador
                          </span>
                        )}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <ParticipantStatusPill paid={p.paid} paymentPending={p.paymentPending} isOverdue={isOverdue} />
                        <span className="text-xs text-zinc-500">
                          {p.paidAt
                            ? formatDateTime(p.paidAt)
                            : p.claimedAt
                              ? `Informado em ${formatDateTime(p.claimedAt)}`
                              : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Money
                    value={p.amount}
                    className={`text-base font-semibold tabular-nums text-right shrink-0 ${p.paid ? 'text-emerald-400' : 'text-zinc-50'}`}
                  />
                </div>

                {!p.isOwner && (
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-800/40">
                    {p.paymentPending && (
                      <button
                        type="button"
                        disabled={togglingId === p.id}
                        onClick={() => handleRejectClaim(p.id)}
                        className="px-3.5 min-h-11 rounded-xl text-xs sm:text-sm font-medium border border-rose-800/50 hover:border-rose-700 bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
                      >
                        Rejeitar
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={togglingId === p.id}
                      onClick={() => handleTogglePaid(p.id)}
                      className={`px-3.5 min-h-11 rounded-xl text-xs sm:text-sm font-semibold transition active:scale-[0.98] cursor-pointer disabled:opacity-50 ${
                        p.paid
                          ? 'border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300'
                          : 'bg-accent hover:bg-accent-hover text-accent-fg shadow-sm'
                      }`}
                    >
                      {p.paid ? 'Reverter' : 'Marcar como pago'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setActionError(null);
        }}
        title="Excluir este Racha?"
        maxWidth="md"
      >
        <div className="space-y-4">
          {actionError && (
            <p role="alert" className="text-sm text-rose-300">{actionError}</p>
          )}

          <p className="text-sm text-zinc-400">
            Tem certeza que deseja excluir &quot;{split.title}&quot;? Esta ação removerá os links públicos e não pode ser desfeita.
          </p>
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => {
                setDeleteModalOpen(false);
                setActionError(null);
              }}
              className="px-4 h-11 text-sm font-semibold text-zinc-300 hover:bg-zinc-900 rounded-xl cursor-pointer transition active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDeleteSplit}
              className="px-4 h-11 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition active:scale-[0.98] cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function SplitAdminPage() {
  return (
    <React.Suspense fallback={<AdminSkeleton />}>
      <SplitAdminContent />
    </React.Suspense>
  );
}
