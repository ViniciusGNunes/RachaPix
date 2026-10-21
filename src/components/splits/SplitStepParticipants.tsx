import React from 'react';
import type { SplitMode } from '@/lib/api';
import { Money } from '@/components/ui/Money';
import { Plus, Trash2 } from 'lucide-react';
import { TermsConsentCheckbox, TermsShortNotice } from '@/components/TermsConsent';
import {
  type ParticipantField,
  sanitizeDecimalInput,
} from '@/hooks/useSplitCreateForm';

function participantInitial(p: { name: string; isOwner: boolean }, idx: number): string {
  const trimmed = p.name.trim();
  if (trimmed) return trimmed.charAt(0).toUpperCase();
  return p.isOwner ? 'E' : String(idx + 1);
}

interface SplitStepParticipantsProps {
  step: number;
  slideDir: 'left' | 'right';
  participants: ParticipantField[];
  splitMode: SplitMode;
  equalShares: { id: string; amount: number }[];
  customSum: number;
  totalAmount: number;
  remainingCustom: number;
  handleAddParticipant: () => void;
  handleRemoveParticipant: (id: string) => void;
  handleUpdateParticipant: (id: string, updates: Partial<ParticipantField>) => void;
}

export function SplitStepParticipants({
  step,
  slideDir,
  participants,
  splitMode,
  equalShares,
  customSum,
  totalAmount,
  remainingCustom,
  handleAddParticipant,
  handleRemoveParticipant,
  handleUpdateParticipant,
}: Readonly<SplitStepParticipantsProps>) {
  const active = step === 2;
  let animClass = 'hidden lg:block';
  if (active) animClass = slideDir === 'right' ? 'animate-slide-from-right' : 'animate-slide-from-left';

  const stepBadgeCls =
    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 border border-accent/30 text-xs font-semibold text-accent';

  return (
    <section
      className={`p-4 sm:p-5 lg:p-4 rounded-lg bg-zinc-900 border border-zinc-800 space-y-4 lg:space-y-3 ${animClass} lg:animate-none`}
    >
      <div className="flex flex-col gap-2.5 pb-1 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-2.5 lg:gap-y-2">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <span className={stepBadgeCls}>3</span>
          <h2 className="text-base font-semibold text-zinc-50 whitespace-nowrap">
            Quem vai pagar
          </h2>
        </div>
        <div className="flex items-center justify-between gap-3 lg:contents">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-800 border border-zinc-700/60 text-zinc-300 whitespace-nowrap">
            {participants.length} {participants.length === 1 ? 'pessoa' : 'pessoas'}
          </span>
          <button
            type="button"
            onClick={handleAddParticipant}
            disabled={participants.length >= 50}
            className="inline-flex items-center justify-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-700 text-xs font-medium text-zinc-200 transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer shrink-0 lg:ml-auto"
            title="Adicionar pessoa"
          >
            <Plus className="w-3.5 h-3.5 text-accent" />
            <span className="lg:hidden xl:inline">Adicionar pessoa</span>
            <span className="sr-only hidden lg:inline xl:hidden">Adicionar pessoa</span>
          </button>
        </div>
      </div>

      {/* Participant rows with avatar initials and clean layout */}
      <div className="divide-y divide-zinc-800 border-y border-zinc-800 lg:max-h-[20.9rem] lg:overflow-y-auto lg:overscroll-contain">
        {participants.map((p, idx) => {
          const equalAmount = equalShares.find((e) => e.id === p.id)?.amount;
          const initial = participantInitial(p, idx);

          return (
            <div
              key={p.id}
              className="py-2 px-2 sm:px-3 flex flex-col gap-1.5 rounded-md transition-colors hover:bg-zinc-900/50 animate-fade-in"
            >
              <div className="flex items-center gap-2.5">
                {/* Avatar-initial circle */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs shrink-0 select-none ${
                    p.isOwner
                      ? 'bg-accent/15 text-accent border border-accent/30'
                      : 'bg-zinc-800 text-zinc-300 border border-zinc-700/60'
                  }`}
                >
                  {initial}
                </div>

                {/* Name input */}
                <input
                  type="text"
                  aria-label="Nome do participante"
                  placeholder={p.isOwner ? 'Seu nome' : `Pessoa ${idx + 1}`}
                  value={p.name}
                  onChange={(e) => handleUpdateParticipant(p.id, { name: e.target.value })}
                  className="flex-1 min-w-0 h-9 sm:h-8 bg-transparent text-zinc-50 text-sm placeholder:text-zinc-400 focus:outline-none focus:shadow-none! focus:border-transparent!"
                />

                {/* Amount: Equal display or Custom input */}
                {splitMode === 'Equal' ? (
                  <div className="text-right shrink-0">
                    <Money
                      value={equalAmount ?? 0}
                      className="text-sm font-semibold text-zinc-200"
                    />
                  </div>
                ) : (
                  <div className="relative shrink-0">
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      aria-label="Valor"
                      placeholder="0,00"
                      value={p.amount}
                      onChange={(e) => handleUpdateParticipant(p.id, { amount: sanitizeDecimalInput(e.target.value) })}
                      className="w-24 sm:w-28 h-8 px-2 text-right tabular-nums rounded-md border border-zinc-800 bg-zinc-950 text-sm text-zinc-50 placeholder:text-zinc-400 focus:border-accent focus:outline-none transition-colors"
                    />
                  </div>
                )}

                {/* Remove icon button */}
                <button
                  type="button"
                  onClick={() => handleRemoveParticipant(p.id)}
                  disabled={participants.length <= 2}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-zinc-400 cursor-pointer shrink-0"
                  aria-label="Remover participante"
                  title="Remover participante"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Organizador checkbox */}
              <div className="pl-9.5 flex items-center">
                <label className="inline-flex items-center gap-2 text-xs text-zinc-400 select-none cursor-pointer hover:text-zinc-300 transition-colors py-0.5">
                  <input
                    type="checkbox"
                    checked={p.isOwner}
                    onChange={(e) => handleUpdateParticipant(p.id, { isOwner: e.target.checked })}
                    className="w-3.5 h-3.5 rounded accent-[var(--accent)] cursor-pointer"
                  />{' '}
                  Organizador, já pagou
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {splitMode === 'Custom' && (
        <div
          className={`p-2.5 rounded-md border text-xs flex flex-wrap items-center justify-between gap-2 ${
            Math.abs(remainingCustom) < 0.01
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
          }`}
        >
          <span>
            <Money value={customSum} className="font-semibold" /> de{' '}
            <Money value={totalAmount} />
          </span>
          <span className="font-medium">
            {Math.abs(remainingCustom) < 0.01 ? (
              'Soma conferida'
            ) : (
              <>
                Faltam <Money value={remainingCustom} />
              </>
            )}
          </span>
        </div>
      )}

      <div className="pt-3 border-t border-zinc-800 space-y-2.5 lg:hidden">
        <TermsShortNotice />
        <TermsConsentCheckbox id="terms-consent-mobile" />
      </div>
    </section>
  );
}
