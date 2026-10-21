'use client';

import React, { useState } from 'react';
import {
  api,
  ApiError,
  type SuggestedTransferDto,
  type MemberPixDto,
} from '@/lib/api';
import { formatBRL } from '@/lib/formatters';
import { Money } from '@/components/ui/Money';
import { toast } from '@/components/ui/Toast';
import { useTermsAccepted, TermsConsentCheckbox, TermsShortNotice } from '@/components/TermsConsent';
import { AlertCircle, QrCode } from 'lucide-react';
import { useBalances } from '@/lib/query';
import { StatusPill } from './GroupFeedback';
import { CreditorPixModal } from './CreditorPixModal';

interface BalancesTabProps {
  groupId: string;
  groupName: string;
  currentMemberId: string | null;
  isAdmin: boolean;
  pendingSettlementsCount: number;
  onOpenSettlement: (fromId?: string, toId?: string, amount?: number) => void;
}

export function BalancesTab({
  groupId,
  groupName,
  currentMemberId,
  isAdmin,
  pendingSettlementsCount,
  onOpenSettlement,
}: Readonly<BalancesTabProps>) {
  const { data: balances } = useBalances(groupId);

  const [creditorPixData, setCreditorPixData] = useState<MemberPixDto | null>(null);
  const [creditorPixTransfer, setCreditorPixTransfer] = useState<SuggestedTransferDto | null>(null);
  const [creditorPixLoading, setCreditorPixLoading] = useState(false);
  const [creditorPixError, setCreditorPixError] = useState<string | null>(null);
  const { accepted: termsAccepted } = useTermsAccepted();

  const handleGenerateCreditorPix = async (st: SuggestedTransferDto) => {
    if (!termsAccepted) {
      toast.error('Aceite os Termos de Uso e a Política de Privacidade para gerar o Pix.');
      return;
    }
    try {
      setCreditorPixLoading(true);
      setCreditorPixError(null);
      const pix = await api.getMemberPix(groupId, st.toMemberId, st.amount);
      setCreditorPixTransfer(st);
      setCreditorPixData(pix);
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Não foi possível gerar o Pix. Verifique se o membro possui chave Pix cadastrada.';
      setCreditorPixError(msg);
    } finally {
      setCreditorPixLoading(false);
    }
  };

  if (!balances) return null;

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-base sm:text-lg font-semibold text-zinc-50 tracking-tight">Saldos</h2>
          {pendingSettlementsCount > 0 && (
            <p className="text-xs text-amber-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>
                {pendingSettlementsCount === 1
                  ? '1 acerto aguardando confirmação não entra no saldo.'
                  : `${pendingSettlementsCount} acertos aguardando confirmação não entram no saldo.`}
              </span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {balances.members.map((m) => {
            const isPositive = m.net > 0.005;
            const isNegative = m.net < -0.005;
            let pillTone: 'emerald' | 'amber' = 'emerald';
            let pillLabel = 'Quitado';
            let netTone = 'text-zinc-400';
            if (isPositive) {
              pillLabel = 'A receber';
              netTone = 'text-emerald-400';
            } else if (isNegative) {
              pillTone = 'amber';
              pillLabel = 'Pendente';
              netTone = 'text-rose-400';
            }

            return (
              <div
                key={m.memberId}
                className="p-3.5 sm:p-4 rounded-lg border border-zinc-800 bg-zinc-900 flex flex-col justify-between gap-3 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-zinc-50 text-sm sm:text-base truncate">{m.name}</span>
                    {m.memberId === currentMemberId && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-accent/15 text-accent border border-accent/25 shrink-0">
                        Você
                      </span>
                    )}
                  </div>
                  <StatusPill tone={pillTone}>{pillLabel}</StatusPill>
                </div>

                <div className="text-xl sm:text-2xl font-bold tabular-nums">
                  <span className={netTone}>
                    <Money value={Math.abs(m.net)} />
                  </span>
                </div>

                <div className="pt-2 border-t border-zinc-800 text-xs text-zinc-400 space-y-0.5">
                  <p>
                    Pagou <span className="text-zinc-200 font-medium">{formatBRL(m.paid)}</span> · Parte devida{' '}
                    <span className="text-zinc-200 font-medium">{formatBRL(m.owed)}</span>
                  </p>
                  {(m.settlementsSent > 0 || m.settlementsReceived > 0) && (
                    <p className="text-zinc-400">
                      Pagamentos +{formatBRL(m.settlementsSent)} / -{formatBRL(m.settlementsReceived)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-3 pt-2">
        <h2 className="text-base sm:text-lg font-semibold text-zinc-50 tracking-tight">Transferências sugeridas</h2>

        {creditorPixError && (
          <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{creditorPixError}</span>
            </div>
            <button
              type="button"
              onClick={() => setCreditorPixError(null)}
              className="font-medium underline hover:opacity-80 cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {balances.suggestedTransfers.length === 0 ? (
          <div className="p-5 rounded-lg border border-zinc-800 bg-zinc-900 text-center text-sm text-zinc-400">
            Quitado. Nenhuma transferência pendente no grupo.
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-3 space-y-2 text-xs">
              <TermsShortNotice />
              <TermsConsentCheckbox id="group-settle-terms-consent" />
            </div>

            {balances.suggestedTransfers.map((st) => {
              const canSettle = isAdmin || (!!currentMemberId && (st.fromMemberId === currentMemberId || st.toMemberId === currentMemberId));

              return (
                <div
                  key={`${st.fromMemberId}-${st.toMemberId}`}
                  className="p-3 sm:p-3.5 rounded-lg border border-zinc-800 bg-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="text-xs sm:text-sm text-zinc-300">
                    <strong className="font-semibold text-zinc-50">{st.fromName}</strong>{' '}
                    deve pagar{' '}
                    <span className="font-bold text-amber-400 tabular-nums"><Money value={st.amount} /></span>{' '}
                    para <strong className="font-semibold text-zinc-50">{st.toName}</strong>
                  </div>

                  {canSettle && (
                    <div className="grid grid-cols-2 sm:flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleGenerateCreditorPix(st)}
                        disabled={creditorPixLoading || !termsAccepted}
                        className="h-10 sm:h-9 px-3 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <QrCode className="w-4 h-4 text-accent" />
                        Gerar Pix QR
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenSettlement(st.fromMemberId, st.toMemberId, st.amount)}
                        className="h-10 sm:h-9 px-3.5 rounded-md bg-accent hover:bg-accent-hover text-accent-fg text-xs sm:text-sm font-medium transition-colors cursor-pointer shadow-sm text-center flex items-center justify-center"
                      >
                        Registrar pagamento
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {creditorPixData && (
        <CreditorPixModal
          pixData={creditorPixData}
          transfer={creditorPixTransfer}
          onClose={() => {
            setCreditorPixData(null);
            setCreditorPixTransfer(null);
          }}
          groupId={groupId}
          groupName={groupName}
        />
      )}
    </div>
  );
}
