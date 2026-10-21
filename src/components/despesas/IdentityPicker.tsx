'use client';

import React, { useState } from 'react';
import { UserRound, Plus } from 'lucide-react';
import type { MemberDto } from '@/lib/api';

interface IdentityPickerProps {
  groupName: string;
  members: MemberDto[];
  /** Picks a free member or joins with a new name. Rejects with a readable error message. */
  onClaim: (req: { memberId?: string; newName?: string }) => Promise<void>;
}

export function IdentityPicker({ groupName, members, onClaim }: Readonly<IdentityPickerProps>) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const free = members.filter((m) => !m.claimed);
  const busy = busyId !== null;

  const run = async (key: string, req: { memberId?: string; newName?: string }) => {
    setError(null);
    setBusyId(key);
    try {
      await onClaim(req);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar. Tente novamente.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full animate-fade-up">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-accent/15 text-accent border border-accent/25">
          <UserRound className="w-4 h-4" />
        </span>
        <h1 className="mt-3.5 text-lg sm:text-xl font-semibold tracking-tight text-zinc-50">Quem é você?</h1>
        <p className="mt-1 text-sm text-zinc-400 leading-relaxed">
          Você foi convidado para <span className="text-zinc-200 font-medium">{groupName}</span>. Escolha seu
          nome para poder lançar despesas e confirmar valores. A escolha fica salva neste navegador.
        </p>

        {free.length > 0 && (
          <ul className="mt-4 space-y-1.5">
            {free.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(m.id, { memberId: m.id })}
                  className="w-full flex items-center gap-2.5 h-10 sm:h-9 px-3 rounded-md border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-800 hover:border-zinc-700 text-left text-sm font-medium text-zinc-100 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 inline-flex items-center justify-center text-xs font-semibold">
                    {m.name.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="flex-1 truncate">{m.name}</span>
                  {busyId === m.id && <span className="text-xs text-zinc-400">Entrando...</span>}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className={free.length > 0 ? 'mt-4 pt-4 border-t border-zinc-800' : 'mt-4'}>
          <label htmlFor="identity-new-name" className="block text-[13px] font-medium text-zinc-300">
            {free.length > 0 ? 'Não está na lista?' : 'Seu nome'}
          </label>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (newName.trim()) void run('new', { newName: newName.trim() });
            }}
          >
            <input
              id="identity-new-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={60}
              placeholder="Seu nome"
              autoComplete="off"
              className="flex-1 min-w-0 h-10 sm:h-9 rounded-md bg-zinc-950 border border-zinc-800 px-3 text-sm text-zinc-100 placeholder:text-zinc-400 focus:border-accent focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={busy || !newName.trim()}
              className="inline-flex items-center justify-center gap-1.5 h-10 sm:h-9 px-3.5 rounded-md bg-accent hover:bg-accent-hover text-accent-fg text-sm font-medium disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              {busyId === 'new' ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-xs text-zinc-400 leading-relaxed">
          Já escolheu seu nome em outro aparelho? Abra o grupo lá, vá em Membros e use{' '}
          <span className="text-zinc-200">Conectar outro aparelho</span>.
        </p>

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-400">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
