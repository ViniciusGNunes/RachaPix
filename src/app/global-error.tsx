'use client';

import React, { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
  reset?: () => void;
}

export default function GlobalError({ error, retry, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('Fatal application error:', error);
  }, [error]);

  const handleRetry = () => {
    if (typeof retry === 'function') {
      retry();
    } else if (typeof reset === 'function') {
      reset();
    } else {
      window.location.reload();
    }
  };

  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full flex items-center justify-center bg-zinc-950 text-zinc-100 font-sans p-4 antialiased">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-lg p-6 md:p-8 text-center space-y-5 shadow-sm">
          <div className="w-10 h-10 mx-auto rounded-md bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-bold text-2xl">
            !
          </div>

          <div className="space-y-2">
            <h1 className="text-xl md:text-2xl font-bold text-zinc-100">
              Erro Crítico
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Ocorreu uma falha grave na inicialização da aplicação.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRetry}
            className="w-full inline-flex items-center justify-center h-9 px-4 rounded-md bg-zinc-100 text-zinc-950 font-semibold text-sm hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            Recarregar aplicação
          </button>
        </div>
      </body>
    </html>
  );
}
