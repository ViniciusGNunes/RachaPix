'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSavedSplits, SavedSplit } from '@/lib/storage';
import { api } from '@/lib/api';
import { splitAdminPath, splitPath } from '@/lib/routes';
import { formatDate } from '@/lib/formatters';
import { Money } from '@/components/ui/Money';
import { Badge } from '@/components/ui/Badge';
import { Receipt, Users, ArrowRight } from 'lucide-react';

interface Totals {
  received: number;
  pending: number;
  map: Record<string, { total: number; paid: number }>;
}

export default function HomePage() {
  const [savedSplits, setSavedSplits] = useState<SavedSplit[]>([]);
  const [mounted, setMounted] = useState(false);
  const [totals, setTotals] = useState<Totals | null>(null);

  useEffect(() => {
    const list = getSavedSplits();
    setSavedSplits(list);
    setMounted(true);

    let cancelled = false;
    const recent = list.slice(0, 5);
    Promise.allSettled(recent.map((s) => api.getSplitPublic(s.slug))).then((results) => {
      if (cancelled) return;
      const map: Totals['map'] = {};
      let received = 0;
      let pending = 0;
      results.forEach((r, i) => {
        if (r.status !== 'fulfilled') return;
        const total = r.value.totalAmount;
        const paid = r.value.paidAmount;
        map[recent[i].slug] = { total, paid };
        received += paid;
        pending += Math.max(0, total - paid);
      });
      if (Object.keys(map).length > 0) setTotals({ received, pending, map });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const hasSplits = mounted && savedSplits.length > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-28 md:pb-12 w-full animate-fade-up space-y-8 sm:space-y-10">
      {hasSplits && totals && (
        <section className="p-5 sm:p-7 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
          <p className="text-[13px] font-medium text-zinc-400">Falta receber</p>
          <Money
            value={totals.pending}
            animate
            className="block text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-zinc-50 tabular-nums my-1"
          />
          <p className="text-sm text-zinc-400">
            {savedSplits.length} {savedSplits.length === 1 ? 'racha' : 'rachas'} ·{' '}
            <Money value={totals.received} className="text-zinc-300 font-medium" /> recebido
          </p>
        </section>
      )}

      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-3xl font-semibold tracking-tight text-zinc-50">
          Dividir conta pelo Pix
        </h1>
        <p className="mt-2 text-sm sm:text-base text-zinc-400 max-w-xl leading-relaxed">
          Informe o valor e quem participou. Cada pessoa recebe um QR Code Pix com a parte dela.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/rachar"
          className="group relative p-5 sm:p-6 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700/80 transition-all duration-200 active:scale-[0.99] flex flex-col justify-between cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 border border-accent/30 text-xs font-semibold text-accent">
                  1
                </span>
                <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-accent group-hover:translate-x-1 transition-all" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-zinc-50 group-hover:text-accent transition-colors flex items-center justify-between">
              Dividir conta
            </h2>
            <p className="mt-1.5 text-sm text-zinc-400 leading-relaxed">
              Uma conta só, dividida na hora. Cada um paga a sua parte.
            </p>
          </div>
        </Link>

        <Link
          href="/despesas"
          className="group relative p-5 sm:p-6 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700/80 transition-all duration-200 active:scale-[0.99] flex flex-col justify-between cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 border border-accent/30 text-xs font-semibold text-accent">
                  2
                </span>
                <div className="w-8 h-8 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200 group-hover:translate-x-1 transition-all" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-zinc-50 group-hover:text-zinc-200 transition-colors flex items-center justify-between">
              Grupos
            </h2>
            <p className="mt-1.5 text-sm text-zinc-400 leading-relaxed">
              Despesas contínuas: veja quem deve quanto e quem paga quem.
            </p>
          </div>
        </Link>
      </div>

      {/* Rachas recentes (localStorage) */}
      {hasSplits && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-medium text-zinc-400">Recentes</h2>
            <span className="text-xs text-zinc-500">Salvos neste navegador</span>
          </div>

          <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800/80 divide-y divide-zinc-800/80 overflow-hidden">
            {savedSplits.map((split) => {
              const info = totals?.map[split.slug];
              const settled = info ? info.total > 0 && info.paid >= info.total : false;
              return (
                <div
                  key={split.slug}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-900/50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <p className="text-sm font-semibold text-zinc-100 truncate">{split.title}</p>
                      {info && <Badge variant={settled ? 'paid' : 'pending'} size="sm" dot />}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      {formatDate(split.createdAt)} · <span className="font-mono text-zinc-400">{split.slug}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 text-sm justify-between sm:justify-end">
                    {split.totalAmount ? (
                      <Money value={split.totalAmount} className="text-base sm:text-lg font-semibold text-zinc-50 tabular-nums" />
                    ) : null}
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={splitPath(split.slug)}
                        className="h-9 px-3 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 hover:border-zinc-700 text-xs font-medium text-zinc-200 transition-all active:scale-[0.98] inline-flex items-center justify-center cursor-pointer"
                      >
                        Abrir
                      </Link>
                      {split.adminToken && (
                        <Link
                          href={splitAdminPath(split.slug, split.adminToken)}
                          className="h-9 px-3 rounded-xl bg-accent/15 border border-accent/30 hover:bg-accent/25 text-xs font-semibold text-accent transition-all active:scale-[0.98] inline-flex items-center justify-center cursor-pointer"
                        >
                          Administrar
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Informações adicionais */}
      <section className="pt-6 sm:pt-8 border-t border-zinc-800/80">
        <p className="text-xs text-zinc-500 max-w-xl leading-relaxed">
          Divisão igual ou com valores diferentes, sem cadastro. O Pix vai direto pra chave de quem pagou,
          sem intermediário, e os centavos que sobram são distribuídos pra soma sempre bater. Nos grupos, o
          app mostra o saldo de cada um e o menor número de transferências pra quitar tudo.
        </p>
      </section>
    </div>
  );
}
