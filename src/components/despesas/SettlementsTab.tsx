'use client';

import React, { useState } from 'react';
import { type SettlementDto } from '@/lib/api';
import { Money } from '@/components/ui/Money';
import { toast } from '@/components/ui/Toast';
import {
  ArrowLeftRight,
  Plus,
  Check,
  Trash2,
} from 'lucide-react';
import { useSettlements, useConfirmSettlement } from '@/lib/query';
import {
  groupByDay,
  errorMessageOr,
} from './groupConstants';
import { StatusPill, DayHeader } from './GroupFeedback';

interface SettlementsTabProps {
  groupId: string;
  currentMemberId: string | null;
  isAdmin: boolean;
  canWrite: boolean;
  onOpenSettlement: () => void;
  onDeleteSettlement: (st: SettlementDto) => void;
}

export function SettlementsTab({
  groupId,
  currentMemberId,
  isAdmin,
  canWrite,
  onOpenSettlement,
  onDeleteSettlement,
}: Readonly<SettlementsTabProps>) {
  const { data: settlements = [] } = useSettlements(groupId);
  const confirmSettlementMutation = useConfirmSettlement();
  const [confirmingSettlementId, setConfirmingSettlementId] = useState<string | null>(null);

  const handleConfirmSettlement = async (settlementId: string) => {
    try {
      setConfirmingSettlementId(settlementId);
      await confirmSettlementMutation.mutateAsync({
        groupId,
        settlementId,
      });
      toast.success('Recebimento confirmado!');
    } catch (err: unknown) {
      toast.error(errorMessageOr(err, 'Erro ao confirmar recebimento.'));
    } finally {
      setConfirmingSettlementId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-3">
        <h2 className="text-lg font-semibold text-zinc-50 tracking-tight">
          Pagamentos
        </h2>
        {canWrite && (
          <button
            type="button"
            onClick={onOpenSettlement}
            className="h-11 px-4 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg text-sm font-semibold flex items-center gap-2 active:scale-[0.98] transition cursor-pointer shrink-0 shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" /> Registrar pagamento
          </button>
        )}
      </div>

      {settlements.length === 0 ? (
        <div className="p-8 sm:p-12 text-center flex flex-col items-center max-w-sm mx-auto rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300 mb-4 shadow-sm">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-zinc-50 text-base">
            Nenhum pagamento registrado
          </h3>
          <p className="text-sm text-zinc-400 mt-1">
            Registre aqui as transferências feitas entre membros.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupByDay(settlements).map((g) => (
            <div key={g.key} className="space-y-2">
              <DayHeader label={g.label} />
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 divide-y divide-zinc-800/80 overflow-hidden">
                {g.items.map((st) => {
                  const isReceiver = !!currentMemberId && currentMemberId === st.toMemberId;
                  const isPending = st.status === 'Pending';
                  const canConfirmReceipt = isPending && (isAdmin || isReceiver);
                  const isReceiverPending = isPending && isReceiver;
                  const canDeleteSettlement =
                    isAdmin || (!!currentMemberId && st.createdByMemberId === currentMemberId) || isReceiverPending;

                  return (
                    <div
                      key={st.id}
                      className="p-3.5 sm:p-4 hover:bg-zinc-900/60 transition-colors flex items-center gap-3.5"
                    >
                      <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 flex items-center justify-center shrink-0">
                        <ArrowLeftRight className="w-5 h-5 text-accent" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-zinc-50 text-sm truncate">
                            {st.fromName} para {st.toName}
                          </p>
                          {isPending && (
                            <StatusPill tone="amber">Aguardando confirmação</StatusPill>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5 truncate">
                          {st.createdByName ? `Registrado por ${st.createdByName}` : ''}
                          {st.notes ? ` · ${st.notes}` : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0 text-base sm:text-lg font-bold tabular-nums text-zinc-50">
                        <Money value={st.amount} />
                      </div>
                      <div className="flex items-center shrink-0 gap-1.5">
                        {canConfirmReceipt && (
                          <button
                            type="button"
                            onClick={() => handleConfirmSettlement(st.id)}
                            disabled={confirmingSettlementId === st.id}
                            className="h-8 px-2.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Confirmar recebimento</span>
                            <span className="sm:hidden">Confirmar</span>
                          </button>
                        )}
                        {canDeleteSettlement && (
                          isReceiverPending ? (
                            <button
                              type="button"
                              onClick={() => onDeleteSettlement(st)}
                              className="h-8 px-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-1 transition active:scale-[0.98] cursor-pointer"
                            >
                              Recusar
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onDeleteSettlement(st)}
                              aria-label="Excluir acerto"
                              className="p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                              title="Excluir acerto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
