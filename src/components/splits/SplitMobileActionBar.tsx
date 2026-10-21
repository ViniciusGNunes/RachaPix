import React from 'react';
import { Money } from '@/components/ui/Money';

interface SplitMobileActionBarProps {
  step: number;
  lastStep: number;
  totalAmount: number;
  loading: boolean;
  termsAccepted: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function SplitMobileActionBar({
  step,
  lastStep,
  totalAmount,
  loading,
  termsAccepted,
  onPrev,
  onNext,
}: SplitMobileActionBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-md px-4 py-2.5 lg:hidden">
      <div className="max-w-xl mx-auto flex items-center gap-3">
        <div className="flex flex-col leading-tight shrink-0">
          <span className="text-xs font-medium text-zinc-400">Total</span>
          <Money value={totalAmount} className="text-lg font-bold text-zinc-50" />
        </div>
        <div className="flex flex-1 gap-2">
          {step > 0 && (
            <button
              type="button"
              onClick={onPrev}
              className="flex-1 h-11 px-4 rounded-xl border border-zinc-800 text-zinc-300 font-semibold text-sm hover:bg-zinc-900 transition-colors active:scale-[0.98] cursor-pointer"
            >
              Voltar
            </button>
          )}
          {step < lastStep ? (
            <button
              key="btn-step-next"
              type="button"
              onClick={onNext}
              className="flex-[2] h-11 px-5 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg font-semibold text-[15px] transition-colors active:scale-[0.98] cursor-pointer flex items-center justify-center"
            >
              Próximo
            </button>
          ) : (
            <button
              key="btn-step-submit"
              type="submit"
              disabled={loading || !termsAccepted}
              className="flex-[2] h-11 px-5 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg font-semibold text-[15px] transition-colors active:scale-[0.98] cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Criando...' : 'Criar racha'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
