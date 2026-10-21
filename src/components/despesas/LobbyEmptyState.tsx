import React from 'react';
import { Plus, Users } from 'lucide-react';

interface LobbyEmptyStateProps {
  onOpenCreateModal: () => void;
}

export function LobbyEmptyState({ onOpenCreateModal }: LobbyEmptyStateProps) {
  return (
    <div className="p-8 sm:p-12 text-center flex flex-col items-center max-w-md mx-auto rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
      <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300 mb-4 shadow-sm">
        <Users className="w-6 h-6" />
      </div>
      <h2 className="text-lg sm:text-xl font-semibold text-zinc-50 tracking-tight">
        Nenhum grupo cadastrado ainda
      </h2>
      <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
        Crie um grupo para começar a adicionar membros, lançar despesas e acompanhar quem deve quanto para quem.
      </p>
      <button
        type="button"
        onClick={onOpenCreateModal}
        className="mt-6 inline-flex items-center gap-2 h-11 sm:h-12 px-5 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg font-semibold text-sm sm:text-[15px] active:scale-[0.98] transition-all cursor-pointer shadow-sm"
      >
        <Plus className="w-4 h-4 stroke-[2.5]" />
        Criar meu primeiro grupo
      </button>
    </div>
  );
}
