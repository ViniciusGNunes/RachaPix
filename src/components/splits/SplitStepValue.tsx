import React from 'react';
import type { SplitMode } from '@/lib/api';
import { sanitizeDecimalInput } from '@/hooks/useSplitCreateForm';

interface SplitStepValueProps {
  step: number;
  slideDir: 'left' | 'right';
  totalAmountStr: string;
  setTotalAmountStr: (val: string) => void;
  title: string;
  setTitle: (val: string) => void;
  splitMode: SplitMode;
  setSplitMode: (mode: SplitMode) => void;
}

export function SplitStepValue({
  step,
  slideDir,
  totalAmountStr,
  setTotalAmountStr,
  title,
  setTitle,
  splitMode,
  setSplitMode,
}: SplitStepValueProps) {
  const active = step === 0;
  const animClass = !active
    ? 'hidden lg:block'
    : slideDir === 'right'
    ? 'animate-slide-from-right'
    : 'animate-slide-from-left';

  const inputCls =
    'w-full h-10 sm:h-9 px-3 rounded-md border border-zinc-800 bg-zinc-950 text-zinc-50 text-sm placeholder:text-zinc-400 focus:border-accent focus:outline-none transition-colors';
  const labelCls = 'block text-xs font-medium text-zinc-400 mb-1';
  const segCls = (isSelected: boolean) =>
    `h-9 sm:h-8 py-1 px-3 rounded-md text-xs sm:text-sm font-medium transition-colors ${
      isSelected
        ? 'bg-zinc-800 text-accent'
        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
    }`;
  const stepBadgeCls =
    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 border border-accent/30 text-xs font-semibold text-accent';

  return (
    <section
      className={`p-4 sm:p-5 lg:p-4 rounded-lg bg-zinc-900 border border-zinc-800 space-y-4 ${animClass} lg:animate-none`}
    >
      <h2 className="flex items-center gap-2.5 text-base font-semibold text-zinc-50">
        <span className={stepBadgeCls}>1</span>
        Valor
      </h2>

      {/* Big amount input is the hero of step 1 */}
      <div className="pt-1 pb-3 sm:py-3 lg:py-1.5 flex flex-col items-center justify-center text-center">
        <label htmlFor="total-amount-input" className="text-xs font-medium text-zinc-400 mb-1.5">
          Valor total
        </label>
        <div className="relative inline-flex items-baseline justify-center">
          <span className="text-3xl sm:text-4xl md:text-5xl font-semibold text-zinc-400 mr-2 select-none">
            R$
          </span>
          <input
            id="total-amount-input"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            required
            placeholder="0,00"
            value={totalAmountStr}
            onChange={(e) => setTotalAmountStr(sanitizeDecimalInput(e.target.value))}
            className="w-52 sm:w-64 md:w-72 text-center bg-transparent border-0 border-b-2 border-zinc-800 focus:border-zinc-800! focus:shadow-none! max-sm:text-4xl! sm:text-5xl md:text-6xl font-bold text-zinc-50 tabular-nums placeholder:text-zinc-400/60 focus:outline-none transition-colors pb-1"
          />
        </div>
      </div>

      <div>
        <label htmlFor="split-title" className={labelCls}>Descrição</label>
        <input
          id="split-title"
          type="text"
          required
          maxLength={80}
          placeholder="Ex: Churrasco de domingo"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputCls}
        />
      </div>

      <div>
        <span className={labelCls}>Divisão</span>
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-md bg-zinc-950/60 border border-zinc-800">
          <button
            type="button"
            onClick={() => setSplitMode('Equal')}
            className={segCls(splitMode === 'Equal')}
          >
            Partes iguais
          </button>
          <button
            type="button"
            onClick={() => setSplitMode('Custom')}
            className={segCls(splitMode === 'Custom')}
          >
            Valores diferentes
          </button>
        </div>
      </div>
    </section>
  );
}
