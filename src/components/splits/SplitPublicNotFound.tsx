import React from 'react';
import Link from 'next/link';

interface SplitPublicNotFoundProps {
  error: string | null;
}

export function SplitPublicNotFound({ error }: Readonly<SplitPublicNotFoundProps>) {
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center animate-fade-up">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 space-y-4">
        <h1 className="text-xl font-semibold text-zinc-50">
          Conta não encontrada
        </h1>
        <p className="text-zinc-400 text-sm">
          {error || 'Não encontramos nenhuma conta com o código informado.'}
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center h-9 px-4 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 rounded-md text-sm font-medium transition-colors"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
