'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
  reset?: () => void;
}

export default function ErrorBoundary({ error, retry, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Unhandled route error:', error);
  }, [error]);

  const handleRetry = () => {
    if (typeof retry === 'function') {
      retry();
    } else if (typeof reset === 'function') {
      reset();
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 md:p-8 text-center space-y-5 shadow-xl">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl md:text-2xl font-bold text-zinc-100 font-brand">
            Ops! Algo deu errado
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            {error?.message && !error.message.includes('digest')
              ? error.message
              : 'Ocorreu uma falha inesperada ao carregar esta página. Tente recarregar ou voltar ao início.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleRetry}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-zinc-950 font-semibold text-sm hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Tentar novamente
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 text-zinc-200 font-medium text-sm hover:bg-zinc-700/80 transition-colors"
          >
            <Home className="w-4 h-4" />
            Início
          </Link>
        </div>
      </div>
    </div>
  );
}
