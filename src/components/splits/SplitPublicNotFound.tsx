import React from 'react';
import Link from 'next/link';

interface SplitPublicNotFoundProps {
  error: string | null;
}

export function SplitPublicNotFound({ error }: SplitPublicNotFoundProps) {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center animate-fade-up">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 space-y-4 shadow-sm backdrop-blur-sm">
        <h1 className="text-xl font-semibold text-zinc-50">
          Conta não encontrada
        </h1>
        <p className="text-zinc-400 text-sm">
          {error || 'Não encontramos nenhuma conta com o código informado.'}
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center min-h-11 px-5 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 rounded-xl text-sm font-medium transition active:scale-[0.98]"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
