'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSavedSplits, SavedSplit } from '@/lib/storage';
import { formatBRL, formatDate } from '@/lib/formatters';

export default function HomePage() {
  const [savedSplits, setSavedSplits] = useState<SavedSplit[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSavedSplits(getSavedSplits());
  }, []);

  return (
    <div className="w-full">
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 md:pt-24 pb-12">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-50">
          Dividir conta pelo Pix
        </h1>
        <p className="mt-3 text-zinc-400 max-w-xl">
          Informe o valor e quem participou. Cada pessoa recebe um QR Code Pix com a
          parte dela.
        </p>

        <div className="mt-10 grid md:grid-cols-2 gap-4">
          <Link
            href="/rachar"
            className="group rounded-lg border border-zinc-800 p-6 hover:border-zinc-600 transition-colors"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-zinc-50">Rachar uma conta</h2>
              <span className="text-zinc-600 group-hover:text-zinc-50 transition-colors">&rarr;</span>
            </div>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
              Uma conta só, dividida na hora. Você manda o link e cada um paga a sua parte.
            </p>
            <p className="mt-4 text-xs text-zinc-600">Pizza, bar, churrasco.</p>
          </Link>

          <Link
            href="/despesas"
            className="group rounded-lg border border-zinc-800 p-6 hover:border-zinc-600 transition-colors"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-zinc-50">Grupo de despesas</h2>
              <span className="text-zinc-600 group-hover:text-zinc-50 transition-colors">&rarr;</span>
            </div>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
              Gastos que vão acumulando. O app mostra quem deve quanto e quem paga quem no
              final.
            </p>
            <p className="mt-4 text-xs text-zinc-600">República, viagem, casal.</p>
          </Link>
        </div>
      </section>

      {/* Rachas recentes (localStorage) */}
      {mounted && savedSplits.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">
          <h2 className="text-sm font-medium text-zinc-50">Recentes</h2>
          <p className="text-sm text-zinc-500 mt-1">Salvos neste navegador.</p>

          <div className="mt-4 divide-y divide-zinc-800 border-y border-zinc-800">
            {savedSplits.map((split) => (
              <div
                key={split.slug}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm text-zinc-200">
                    {split.title}
                    {split.totalAmount && (
                      <span className="text-zinc-500"> · {formatBRL(split.totalAmount)}</span>
                    )}
                  </p>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    {formatDate(split.createdAt)} · <span className="font-mono">{split.slug}</span>
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <Link
                    href={`/r/${split.slug}`}
                    className="text-zinc-400 hover:text-zinc-50 transition-colors"
                  >
                    Abrir
                  </Link>
                  {split.adminToken && (
                    <Link
                      href={`/r/${split.slug}/admin?token=${split.adminToken}`}
                      className="text-zinc-50 underline underline-offset-4 decoration-zinc-600 hover:decoration-zinc-300 transition-colors"
                    >
                      Administrar
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="border-t border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <p className="text-xs text-zinc-500 max-w-xl leading-relaxed">
            Divisão igual ou com valores diferentes, sem cadastro. O Pix vai direto pra chave de quem pagou,
            sem intermediário, e os centavos que sobram são distribuídos pra soma sempre bater. Nos grupos, o
            app mostra o saldo de cada um e o menor número de transferências pra quitar tudo.
          </p>
        </div>
      </section>
    </div>
  );
}
