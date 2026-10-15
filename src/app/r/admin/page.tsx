'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  api,
  ApiError,
  SplitAdminDto,
} from '@/lib/api';
import { formatBRL, formatDateTime } from '@/lib/formatters';
import { getSavedSplitToken, removeSavedSplit, saveSplit } from '@/lib/storage';
import { absoluteUrl, splitAdminPath, splitPath } from '@/lib/routes';
import { CopyButton } from '@/components/ui/CopyButton';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Shield,
  CheckCircle2,
  Clock,
  Trash2,
  ExternalLink,
  Users,
  RefreshCw,
  AlertCircle,
  KeyRound,
  RotateCcw,
} from 'lucide-react';

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
      setIsDeleting(false);
    }
  };

  const publicUrl = absoluteUrl(splitPath(slug));

  // If no token provided yet
  if (!token && !loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className=" bg-zinc-950 rounded-xl p-8 border border-zinc-800 text-center space-y-6">
          <div className="w-16 h-16 rounded-xl bg-amber-950/60 text-amber-400 flex items-center justify-center mx-auto">
            <KeyRound className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Acesso ao Painel Admin
            </h1>
            <p className="text-xs text-zinc-400 mt-2">
              Informe a chave secreta gerada na criação do racha &quot;{slug}&quot;.
            </p>
          </div>

          <form onSubmit={handleApplyToken} className="space-y-4">
            <input
              type="text"
              required
              placeholder="Cole o token de administrador aqui"
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900 text-white text-sm font-mono focus:ring-2 focus:ring-zinc-600 focus:outline-none"
            />
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-zinc-50 hover:bg-zinc-200 text-zinc-950 font-bold text-sm transition-colors cursor-pointer"
            >
              Acessar Painel
            </button>
          </form>

          <div className="pt-2">
            <Link
              href={splitPath(slug)}
              className="text-xs text-zinc-400 hover:text-zinc-300"
            >
              &larr; Voltar para a página pública de pagamento
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !split) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <p className="text-zinc-400 text-sm">Carregando painel do administrador...</p>
      </div>
    );
  }

  if (error || !split) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 bg-rose-950/60 text-rose-400 rounded-xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">
          Erro de Autenticação
        </h1>
        <p className="text-zinc-400 text-sm mb-6">{error}</p>
        <button
          onClick={() => {
            setToken('');
            setError(null);
          }}
          className="px-4 py-2 bg-zinc-50 text-zinc-950 rounded-xl text-sm font-semibold hover:bg-zinc-100"
        >
          Inserir outro token
        </button>
      </div>
    );
  }

  const progressPct =
    split.totalAmount > 0
      ? Math.min(100, Math.round((split.paidAmount / split.totalAmount) * 100))
      : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full space-y-6">
      {actionError && !deleteModalOpen && (
        <div className=" bg-rose-950/40 border border-rose-800 text-rose-300 p-4 rounded-xl text-sm flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-xs font-semibold hover:underline cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Top Admin Banner */}
      <div className=" bg-zinc-950 rounded-xl p-6 sm:p-7 border border-zinc-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-800">
                <Shield className="w-3.5 h-3.5" /> Painel do Organizador
              </span>
              {refreshing && (
                <span className="text-xs text-zinc-500 flex items-center gap-1 animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Atualizando...
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-semibold text-white mt-2">
              {split.title}
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Pix de: <strong className=" text-zinc-300">{split.receiverName}</strong> ({split.receiverCity}) &bull; Chave ({split.pixKeyType}): <span className="font-mono text-zinc-300">{split.pixKey}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={splitPath(slug)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Ver Página Pública
            </Link>
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-900/60 text-xs font-semibold text-rose-400 hover:bg-rose-950/50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Excluir Racha
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
            <span className="text-xs text-zinc-500 font-medium uppercase">Total</span>
            <p className="text-xl font-bold text-white mt-0.5">
              {formatBRL(split.totalAmount)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800">
            <span className="text-xs text-emerald-400 font-medium uppercase">Recebido</span>
            <p className="text-xl font-bold text-emerald-300 mt-0.5">
              {formatBRL(split.paidAmount)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800">
            <span className="text-xs text-amber-400 font-medium uppercase">Pendente</span>
            <p className="text-xl font-bold text-amber-300 mt-0.5">
              {formatBRL(split.totalAmount - split.paidAmount)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
            <span className="text-xs text-zinc-500 font-medium uppercase">Participantes</span>
            <p className="text-xl font-bold text-white mt-0.5">
              {split.paidCount} / {split.participants.length} pagos
            </p>
            {split.pendingCount > 0 && (
              <span className="text-xs font-medium text-blue-400">
                {split.pendingCount} aguardando confirmação
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5 pt-1">
          <div className="w-full bg-zinc-900 h-3 rounded-full overflow-hidden">
            <div
              className="bg-zinc-50 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-right text-xs font-semibold text-zinc-500">
            Progresso: {progressPct}% concluído (atualiza automaticamente a cada 10s)
          </p>
        </div>

        {/* Share box */}
        <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-zinc-300">
              Link de compartilhamento para o grupo:
            </span>
            <span className="text-xs font-mono text-zinc-400 truncate max-w-xs">{publicUrl}</span>
          </div>
          <CopyButton text={publicUrl} label="Copiar Link" variant="primary" size="sm" />
        </div>
      </div>

      {/* Participants Table */}
      <div className=" bg-zinc-950 rounded-xl p-6 sm:p-7 border border-zinc-800 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-400" />
          Status dos Pagamentos ({split.participants.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                <th className="py-3 px-3">Participante</th>
                <th className="py-3 px-3">Valor</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 hidden sm:table-cell">Pago em</th>
                <th className="py-3 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {split.participants.map((p) => (
                <tr key={p.id} className=" hover:bg-zinc-900/30">
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">
                        {p.name}
                      </span>
                      {p.isOwner && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400">
                          Organizador
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 font-bold text-white">
                    {formatBRL(p.amount)}
                  </td>
                  <td className="py-3.5 px-3">
                    {p.paid ? (
                      <Badge variant="emerald" size="sm">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Pago
                      </Badge>
                    ) : p.paymentPending ? (
                      <Badge variant="blue" size="sm">
                        <Clock className="w-3.5 h-3.5" /> Aguardando confirmação
                      </Badge>
                    ) : (
                      <Badge variant="amber" size="sm">
                        <Clock className="w-3.5 h-3.5" /> Pendente
                      </Badge>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-xs text-zinc-500 hidden sm:table-cell">
                    {p.paidAt
                      ? formatDateTime(p.paidAt)
                      : p.claimedAt
                        ? `Informado em ${formatDateTime(p.claimedAt)}`
                        : '—'}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    {p.isOwner ? (
                      <span className="text-xs text-zinc-500 font-medium italic">
                        Organizador (Quitado)
                      </span>
                    ) : (
                      <div className="inline-flex items-center gap-2">
                      {p.paymentPending && (
                        <button
                          type="button"
                          disabled={togglingId === p.id}
                          onClick={() => handleRejectClaim(p.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-zinc-800 text-zinc-400 hover:bg-zinc-900 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Rejeitar
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={togglingId === p.id}
                        onClick={() => handleTogglePaid(p.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
                          p.paid
                            ? 'border border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                            : 'bg-zinc-50 text-zinc-950 hover:bg-zinc-200'
                        }`}
                      >
                        {p.paid ? (
                          <>
                            <RotateCcw className="w-3.5 h-3.5" /> Reverter
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar
                          </>
                        )}
                      </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{actionError}</span>
            </div>
          )}

          <p className="text-sm text-zinc-400">
            Tem certeza que deseja excluir &quot;{split.title}&quot;? Esta ação removerá os links públicos e não pode ser desfeita.
          </p>
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => {
                setDeleteModalOpen(false);
                setActionError(null);
              }}
              className="px-4 py-2 text-sm font-semibold text-zinc-300 hover:bg-zinc-900 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDeleteSplit}
              className="px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? 'Excluindo...' : 'Sim, excluir definitivamente'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function SplitAdminPage() {
  return (
    <React.Suspense
      fallback={
        <div className="py-24 flex flex-col items-center justify-center">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
          <p className="text-zinc-400 text-sm">Carregando painel administrativo...</p>
        </div>
      }
    >
      <SplitAdminContent />
    </React.Suspense>
  );
}
