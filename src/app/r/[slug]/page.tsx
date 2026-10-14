'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import {
  api,
  ApiError,
  SplitParticipantPixDto,
  SplitParticipantPublicDto,
  SplitPublicDto,
} from '@/lib/api';
import { formatBRL, formatDate } from '@/lib/formatters';
import { getSavedSplitToken } from '@/lib/storage';
import { PixQrModal } from '@/components/splits/PixQrModal';
import { CopyButton } from '@/components/ui/CopyButton';
import { Badge } from '@/components/ui/Badge';
import {
  CheckCircle2,
  Clock,
  User,
  Shield,
  QrCode,
  Share2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

function PublicSplitContent({ params }: PageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

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
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Falha ao marcar como pago.';
      setActionError(msg);
    } finally {
      setMarkingPaid(false);
    }
  };

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  if (loading && !split) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <p className="text-zinc-400 text-sm">Carregando divisão da conta...</p>
      </div>
    );
  }

  if (error || !split) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 bg-rose-950 text-rose-400 rounded-xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">
          Conta não encontrada
        </h1>
        <p className="text-zinc-400 text-sm mb-6">
          {error || 'Não encontramos nenhuma conta com o código informado.'}
        </p>
        <Link
          href="/"
          className="inline-flex px-4 py-2 bg-zinc-50 text-zinc-950 rounded-xl text-sm font-semibold hover:bg-zinc-100"
        >
          Voltar ao início
        </Link>
      </div>
    );
  }

  const progressPct =
    split.totalAmount > 0
      ? Math.min(100, Math.round((split.paidAmount / split.totalAmount) * 100))
      : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 w-full space-y-6">
      {/* Top Banner & Header */}
      <div className=" bg-zinc-950 rounded-xl p-6 sm:p-7 border border-zinc-800 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Racha de Conta &bull; {split.slug}
            </span>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white mt-1">
              {split.title}
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Organizado por <strong className=" text-zinc-300">{split.receiverName}</strong> &bull; {formatDate(split.createdAt)}
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs text-zinc-500 uppercase font-semibold block">Total</span>
            <span className="text-2xl font-semibold text-white">
              {formatBRL(split.totalAmount)}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="pt-2">
          <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
            <span className=" text-zinc-400">
              Arrecadado: <strong className="text-emerald-400">{formatBRL(split.paidAmount)}</strong> ({progressPct}%)
            </span>
            <span className=" text-zinc-400">
              {split.paidCount} de {split.participants.length} pagos
              {split.pendingCount > 0 && ` · ${split.pendingCount} aguardando confirmação`}
            </span>
          </div>
          <div className="w-full bg-zinc-900 h-3 rounded-full overflow-hidden">
            <div
              className="bg-zinc-50 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Share buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <CopyButton
              text={pageUrl}
              label="Copiar Link do Racha"
              copiedLabel="Link Copiado!"
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
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg border border-zinc-800 hover:bg-zinc-900 text-zinc-300"
              >
                <Share2 className="w-3.5 h-3.5" /> Compartilhar
              </button>
            )}
          </div>

          {savedToken && (
            <Link
              href={`/r/${split.slug}/admin?token=${savedToken}`}
              className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
            >
              <Shield className="w-3.5 h-3.5" /> Painel Admin
            </Link>
          )}
        </div>
      </div>

      {/* Action error banner */}
      {actionError && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-sm flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
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

      {/* Owner notice alert if clicked */}
      {ownerNotice && (
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-50 text-sm flex items-center gap-3 animate-in fade-in">
          <span>{ownerNotice}</span>
        </div>
      )}

      {/* Participants List */}
      <div className=" bg-zinc-950 rounded-xl p-6 sm:p-7 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-400" />
            Escolha seu nome para pagar
          </h2>
          <span className="text-xs text-zinc-500">Clique em &quot;Sou eu&quot;</span>
        </div>

        <div className="divide-y divide-zinc-800">
          {split.participants.map((p) => (
            <div
              key={p.id}
              className="py-3.5 flex items-center justify-between gap-3 group hover:bg-zinc-900/30 px-2 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                    p.paid
                      ? '  bg-emerald-950 text-emerald-300'
                      : '  bg-zinc-900 text-zinc-300'
                  }`}
                >
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">
                      {p.name}
                    </span>
                    {p.isOwner && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400">
                        Organizador
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-emerald-400">
                    {formatBRL(p.amount)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
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

                <button
                  type="button"
                  disabled={loadingPix}
                  onClick={() => handleSelectParticipant(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                    p.paid || p.paymentPending
                      ? 'border border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                      : 'bg-zinc-50 text-zinc-950 hover:bg-zinc-200'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  {p.paid || p.paymentPending ? 'Ver Pix' : 'Sou eu (Pagar)'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

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
        />
      )}
    </div>
  );
}

export default function PublicSplitPage(props: PageProps) {
  return (
    <React.Suspense
      fallback={
        <div className="py-24 flex flex-col items-center justify-center">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
          <p className="text-zinc-400 text-sm">Carregando divisão da conta...</p>
        </div>
      }
    >
      <PublicSplitContent {...props} />
    </React.Suspense>
  );
}
