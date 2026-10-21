'use client';

import React from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';
import { AlertCircle } from 'lucide-react';
import {
  errorMessageOr,
  type PillTone,
  PILL_STYLE,
  PILL_DOT,
} from './groupConstants';

export function StatusPill({ tone, children }: Readonly<{ tone: PillTone; children: React.ReactNode }>) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border text-xs font-medium px-2.5 py-0.5 ${PILL_STYLE[tone]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${PILL_DOT[tone]}`} />
      {children}
    </span>
  );
}

export function DayHeader({ label }: Readonly<{ label: string }>) {
  return (
    <div className="sticky top-0 z-10 pt-4 pb-2 bg-background/95 backdrop-blur-sm text-xs font-semibold uppercase tracking-wider text-zinc-400">
      {label}
    </div>
  );
}

export function GroupLoadingSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 lg:pt-4 pb-28 lg:pb-12 w-full space-y-4 animate-fade-up" aria-busy="true">
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-12 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
    </div>
  );
}

export function GroupNotFound({ error }: Readonly<{ error: unknown }>) {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center animate-fade-up">
      <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/30 flex items-center justify-center mx-auto mb-4 shadow-sm">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-50 mb-2">
        Grupo não encontrado
      </h1>
      <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
        {errorMessageOr(error, 'Esse grupo não existe ou o link não tem permissão de acesso.')}
      </p>
      <Link
        href="/despesas"
        className="inline-flex items-center justify-center h-11 sm:h-12 px-5 bg-accent text-accent-fg rounded-xl text-sm font-semibold hover:bg-accent-hover active:scale-[0.98] transition-all shadow-sm"
      >
        Voltar para grupos
      </Link>
    </div>
  );
}
