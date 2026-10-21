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
}: Readonly<SplitAdminTokenPromptProps>) {
  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-20 animate-fade-up">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 sm:p-6 space-y-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-50">Painel do organizador</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1.5">
            Informe a chave secreta gerada na criação do racha &quot;{slug}&quot;.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5">
          <div className="space-y-1">
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
              className="w-full h-10 sm:h-9 px-3 rounded-md border border-zinc-800 bg-zinc-950 text-zinc-50 text-sm font-mono focus:border-accent focus:outline-none placeholder:text-zinc-400"
            />
          </div>
          <button
            type="submit"
            className="w-full h-10 sm:h-9 px-4 rounded-md bg-accent hover:bg-accent-hover text-accent-fg font-semibold text-sm transition-colors cursor-pointer"
          >
            Acessar
          </button>
        </form>

        <div className="pt-2 border-t border-zinc-800 text-center">
          <Link
            href={splitPath(slug)}
            className="inline-flex items-center justify-center text-xs sm:text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors h-9"
          >
            Voltar para a página pública
          </Link>
        </div>
      </div>
    </div>
  );
}
