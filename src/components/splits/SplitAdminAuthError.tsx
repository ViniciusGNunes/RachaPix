import React from 'react';

interface SplitAdminAuthErrorProps {
  error: string | null;
  onResetToken: () => void;
}

export function SplitAdminAuthError({ error, onResetToken }: SplitAdminAuthErrorProps) {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center animate-fade-up">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 space-y-4 shadow-sm backdrop-blur-sm">
        <h1 className="text-xl font-bold text-zinc-50">
          Erro de autenticação
        </h1>
        <p className="text-zinc-400 text-sm">{error}</p>
        <div className="pt-2">
          <button
            type="button"
            onClick={onResetToken}
            className="px-5 min-h-11 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 rounded-xl text-sm font-medium transition active:scale-[0.98] cursor-pointer"
          >
            Inserir outro token
          </button>
        </div>
      </div>
    </div>
  );
}
