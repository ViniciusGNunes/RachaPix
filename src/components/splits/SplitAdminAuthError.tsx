import React from 'react';

interface SplitAdminAuthErrorProps {
  error: string | null;
  onResetToken: () => void;
}

export function SplitAdminAuthError({ error, onResetToken }: Readonly<SplitAdminAuthErrorProps>) {
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center animate-fade-up">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 space-y-4">
        <h1 className="text-xl font-bold text-zinc-50">
          Erro de autenticação
        </h1>
        <p className="text-zinc-400 text-sm">{error}</p>
        <div className="pt-2">
          <button
            type="button"
            onClick={onResetToken}
            className="px-4 h-9 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 rounded-md text-sm font-medium transition-colors cursor-pointer"
          >
            Inserir outro token
          </button>
        </div>
      </div>
    </div>
  );
}
