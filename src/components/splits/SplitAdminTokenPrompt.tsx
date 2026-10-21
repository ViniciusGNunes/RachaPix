import React from 'react';
import Link from 'next/link';
import { splitPath } from '@/lib/routes';

interface SplitAdminTokenPromptProps {
  slug: string;
  inputToken: string;
  setInputToken: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function SplitAdminTokenPrompt({
  slug,
  inputToken,
  setInputToken,
  onSubmit,
}: SplitAdminTokenPromptProps) {
  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24 animate-fade-up">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8 space-y-6 shadow-sm backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Painel do organizador</h1>
          <p className="text-sm text-zinc-400 mt-2">
            Informe a chave secreta gerada na criação do racha &quot;{slug}&quot;.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="token-input" className="text-xs font-medium text-zinc-400">
              Token de administrador
            </label>
            <input
              id="token-input"
              type="text"
              required
              placeholder="Cole o token de administrador"
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-50 text-sm font-mono focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none placeholder:text-zinc-500"
            />
          </div>
          <button
            type="submit"
            className="w-full h-12 px-4 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg font-semibold text-base transition active:scale-[0.98] cursor-pointer shadow-sm"
          >
            Acessar
          </button>
        </form>

        <div className="pt-2 border-t border-zinc-800/60 text-center">
          <Link
            href={splitPath(slug)}
            className="inline-flex items-center justify-center text-sm font-medium text-zinc-400 hover:text-zinc-200 transition min-h-11"
          >
            Voltar para a página pública
          </Link>
        </div>
      </div>
    </div>
  );
}
