import React from 'react';
import Link from 'next/link';
import { Receipt, ArrowRight, Wallet, UserPlus, QrCode } from 'lucide-react';
import type { SavedSplit } from '@/lib/storage';
import type { SplitTotals } from '@/hooks/useSplitHomeTotals';
import { SplitHomeTotals } from '@/components/splits/SplitHomeTotals';
import { SplitHomeRecentList } from '@/components/splits/SplitHomeRecentList';

interface HomeSplitPanelProps {
  savedSplits: SavedSplit[];
  totals: SplitTotals | null;
}

const STEPS = [
  { icon: Wallet, title: 'Informe o valor', text: 'Total da conta e a chave Pix de quem recebe.' },
  { icon: UserPlus, title: 'Adicione quem participou', text: 'Divisão igual ou com valores diferentes.' },
  { icon: QrCode, title: 'Compartilhe os QR Codes', text: 'Cada pessoa paga a própria parte na hora.' },
];

export function HomeSplitPanel({ savedSplits, totals }: HomeSplitPanelProps) {
  const hasSplits = savedSplits.length > 0;

  return (
    <section
      aria-labelledby="home-split-title"
      className="relative overflow-hidden flex flex-col gap-8 rounded-3xl border border-zinc-800/80 bg-gradient-to-br from-accent/[0.07] via-zinc-900/40 to-zinc-900/20 p-6 sm:p-10 lg:p-12"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-accent/10 blur-3xl"
      />

      <div className="relative space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent">
          <Receipt className="w-7 h-7" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Rápido, sem cadastro</p>
          <h1
            id="home-split-title"
            className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-zinc-50"
          >
            Dividir conta pelo Pix
          </h1>
          <p className="mt-3 text-base sm:text-lg text-zinc-400 leading-relaxed max-w-xl">
            Informe o valor e quem participou. Cada pessoa recebe um QR Code Pix com a parte dela, direto na chave de
            quem pagou.
          </p>
        </div>
        <Link
          href="/rachar"
          className="group h-14 px-6 rounded-2xl bg-accent text-zinc-950 hover:brightness-110 text-base font-semibold transition-all active:scale-[0.99] inline-flex items-center justify-between gap-6 cursor-pointer shadow-lg shadow-accent/10"
        >
          Dividir uma conta agora
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <ol className="relative grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-4 space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 border border-accent/30 text-xs font-semibold text-accent">
                {i + 1}
              </span>
              <Icon className="w-4 h-4 text-zinc-400" />
            </div>
            <p className="text-sm font-semibold text-zinc-100">{title}</p>
            <p className="text-xs text-zinc-400 leading-relaxed">{text}</p>
          </li>
        ))}
      </ol>

      <div className="relative mt-auto space-y-6">
        {hasSplits && totals && <SplitHomeTotals totals={totals} count={savedSplits.length} />}
        {hasSplits ? (
          <SplitHomeRecentList savedSplits={savedSplits} totals={totals} />
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-800 p-5 text-sm text-zinc-500 leading-relaxed">
            Suas contas divididas aparecem aqui, salvas neste navegador. Os centavos que sobram são distribuídos pra
            soma sempre bater.
          </div>
        )}
      </div>
    </section>
  );
}
