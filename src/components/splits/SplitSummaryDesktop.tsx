import React from 'react';
import type { SplitMode } from '@/lib/api';
import { Money } from '@/components/ui/Money';
import { TermsConsentCheckbox, TermsShortNotice } from '@/components/TermsConsent';

interface SplitSummaryDesktopProps {
  totalAmount: number;
  splitMode: SplitMode;
  participantsCount: number;
  equalAmount: number;
  loading: boolean;
  termsAccepted: boolean;
}

export function SplitSummaryDesktop({
  totalAmount,
  splitMode,
  participantsCount,
  equalAmount,
  loading,
  termsAccepted,
}: SplitSummaryDesktopProps) {
  return (
    <div className="hidden lg:block sticky top-20 rounded-lg bg-zinc-900 border border-zinc-800 p-4 space-y-3.5">
      <h3 className="text-xs font-medium text-zinc-400">
        Resumo
      </h3>
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-zinc-400">Total da conta</span>
          <Money value={totalAmount} className="text-2xl font-bold text-zinc-50" />
        </div>
        <div className="flex items-baseline justify-between text-sm py-2 border-t border-zinc-800">
          <span className="text-zinc-400">
            {splitMode === 'Equal' ? `Por pessoa (${participantsCount})` : 'Pessoas'}
          </span>
          <span className="font-semibold text-zinc-200">
            {splitMode === 'Equal' ? (
              <Money value={equalAmount} />
            ) : (
              `${participantsCount} participantes`
            )}
          </span>
        </div>
      </div>

      <div className="pt-2 border-t border-zinc-800 space-y-2.5">
        <TermsShortNotice />
        <TermsConsentCheckbox id="terms-consent-desktop" />
      </div>

      <button
        type="submit"
        disabled={loading || !termsAccepted}
        className="w-full h-9 rounded-md bg-accent hover:bg-accent-hover text-accent-fg font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Criando...' : 'Criar racha'}
      </button>
    </div>
  );
}
