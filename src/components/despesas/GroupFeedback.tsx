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
    <div className="sticky top-0 z-10 pt-3 pb-1.5 bg-background text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
      {label}
    </div>
  );
}

export function GroupLoadingSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 lg:pt-4 pb-28 lg:pb-12 w-full space-y-4 animate-fade-up" aria-busy="true">
      <Skeleton className="h-28 w-full rounded-lg" />
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-20 w-full rounded-lg" />
      <Skeleton className="h-20 w-full rounded-lg" />
      <Skeleton className="h-20 w-full rounded-lg" />
    </div>
  );
}

export function GroupNoAccess() {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center animate-fade-up">
      <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/30 flex items-center justify-center mx-auto mb-3.5">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-50 mb-2">
        Sem acesso a este grupo
      </h1>
      <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
        Você não tem permissão para ver este grupo. Peça um link de convite a quem já participa.
      </p>
      <Link
        href="/despesas"
        className="inline-flex items-center justify-center h-10 sm:h-9 px-4 bg-accent text-accent-fg rounded-md text-sm font-medium hover:bg-accent-hover transition-colors shadow-sm"
      >
        Voltar para grupos
      </Link>
    </div>
  );
}

export function GroupNotFound({ error }: Readonly<{ error: unknown }>) {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center animate-fade-up">
      <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/30 flex items-center justify-center mx-auto mb-3.5">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-50 mb-2">
        Grupo não encontrado
      </h1>
      <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
        {errorMessageOr(error, 'Esse grupo não existe ou o link não tem permissão de acesso.')}
      </p>
      <Link
        href="/despesas"
        className="inline-flex items-center justify-center h-10 sm:h-9 px-4 bg-accent text-accent-fg rounded-md text-sm font-medium hover:bg-accent-hover transition-colors shadow-sm"
      >
        Voltar para grupos
      </Link>
    </div>
  );
}
