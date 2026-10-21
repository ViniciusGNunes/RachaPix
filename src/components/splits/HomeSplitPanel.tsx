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
      className="flex flex-col gap-6 rounded-lg border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6 lg:p-8"
    >
      <div className="space-y-4">
        <div className="w-10 h-10 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
          <Receipt className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">Rápido, sem cadastro</p>
          <h1
            id="home-split-title"
            className="mt-1.5 text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-50"
          >
            Dividir conta pelo Pix
          </h1>
          <p className="mt-2 text-sm sm:text-base text-zinc-400 leading-relaxed max-w-xl">
            Informe o valor e quem participou. Cada pessoa recebe um QR Code Pix com a parte dela, direto na chave de
            quem pagou.
          </p>
        </div>
        <div>
          <Link
            href="/rachar"
            className="group h-10 sm:h-9 px-4 rounded-md bg-accent text-zinc-950 hover:brightness-110 text-sm font-semibold transition-all active:scale-[0.99] inline-flex items-center justify-between gap-4 cursor-pointer"
          >
            Dividir uma conta agora
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      <ol className="divide-y divide-zinc-800 border-y border-zinc-800">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="py-2.5 sm:py-3 flex items-start gap-3">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent/15 ring-1 ring-inset ring-accent/30 text-xs leading-none font-semibold tabular-nums text-accent">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <p className="text-sm font-medium text-zinc-100">{title}</p>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{text}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-auto space-y-4">
        {hasSplits && totals && <SplitHomeTotals totals={totals} count={savedSplits.length} />}
        {hasSplits ? (
          <SplitHomeRecentList savedSplits={savedSplits} totals={totals} />
        ) : (
          <div className="rounded-md border border-dashed border-zinc-800 p-4 text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Suas contas divididas aparecem aqui, salvas neste navegador. Os centavos que sobram são distribuídos pra
            soma sempre bater.
          </div>
        )}
      </div>
    </section>
  );
}
