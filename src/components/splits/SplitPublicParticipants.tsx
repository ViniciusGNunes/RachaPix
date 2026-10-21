import React from 'react';
import type { SplitParticipantPublicDto, SplitPublicDto } from '@/lib/api';
import { Money } from '@/components/ui/Money';
import { ParticipantStatusPill } from '@/components/splits/PixQrModal';
import { TermsConsentCheckbox, TermsShortNotice } from '@/components/TermsConsent';

interface SplitPublicParticipantsProps {
  split: SplitPublicDto;
  isOverdue: boolean;
  loadingPix: boolean;
  termsAccepted: boolean;
  onSelectParticipant: (p: SplitParticipantPublicDto) => void;
}

export function SplitPublicParticipants({
  split,
  isOverdue,
  loadingPix,
  termsAccepted,
  onSelectParticipant,
}: SplitPublicParticipantsProps) {
  return (
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
          let actionLabel = 'Pagar minha parte';
          let actionClass = 'bg-accent hover:bg-accent-hover text-accent-fg shadow-sm';
          if (p.paid) {
            actionLabel = 'Ver comprovante';
            actionClass = 'border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300';
          } else if (p.paymentPending) {
            actionLabel = 'Ver Pix';
            actionClass = 'border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300';
          }
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
                    <ParticipantStatusPill paid={p.paid} paymentPending={p.paymentPending} isOverdue={isOverdue} />
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
                  onClick={() => onSelectParticipant(p)}
                  className={`px-3.5 min-h-11 rounded-xl text-xs sm:text-sm font-semibold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${actionClass}`}
                >
                  {actionLabel}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
