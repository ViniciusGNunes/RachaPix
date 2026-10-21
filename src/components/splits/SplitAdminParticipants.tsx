import React from 'react';
import type { SplitAdminDto } from '@/lib/api';
import { formatDateTime } from '@/lib/formatters';
import { Money } from '@/components/ui/Money';
import { ParticipantStatusPill } from '@/components/splits/PixQrModal';

interface SplitAdminParticipantsProps {
  participants: SplitAdminDto['participants'];
  isOverdue: boolean;
  togglingId: string | null;
  onRejectClaim: (id: string) => void;
  onTogglePaid: (id: string) => void;
}

export function SplitAdminParticipants({
  participants,
  isOverdue,
  togglingId,
  onRejectClaim,
  onTogglePaid,
}: SplitAdminParticipantsProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base sm:text-lg font-semibold text-zinc-50">
          Participantes ({participants.length})
        </h2>
      </div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 divide-y divide-zinc-800/60 overflow-hidden shadow-sm backdrop-blur-sm">
        {participants.map((p) => {
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
                      onClick={() => onRejectClaim(p.id)}
                      className="px-3.5 min-h-11 rounded-xl text-xs sm:text-sm font-medium border border-rose-800/50 hover:border-rose-700 bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
                    >
                      Rejeitar
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={togglingId === p.id}
                    onClick={() => onTogglePaid(p.id)}
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
  );
}
