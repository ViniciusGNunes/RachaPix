import React from 'react';
import { Plus, Users } from 'lucide-react';

interface LobbyEmptyStateProps {
  onOpenCreateModal: () => void;
}

export function LobbyEmptyState({ onOpenCreateModal }: LobbyEmptyStateProps) {
  return (
    <div className="p-6 sm:p-8 text-center flex flex-col items-center max-w-md mx-auto rounded-lg bg-zinc-900 border border-zinc-800">
      <div className="w-10 h-10 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 mb-3.5">
        <Users className="w-5 h-5" />
      </div>
      <h2 className="text-base sm:text-lg font-semibold text-zinc-50 tracking-tight">
        Nenhum grupo cadastrado ainda
      </h2>
      <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">
        Crie um grupo para começar a adicionar membros, lançar despesas e acompanhar quem deve quanto para quem.
      </p>
      <button
        type="button"
        onClick={onOpenCreateModal}
        className="mt-5 inline-flex items-center gap-2 h-10 sm:h-9 px-4 rounded-md bg-accent hover:bg-accent-hover text-accent-fg font-medium text-sm transition-colors cursor-pointer shadow-sm"
      >
        <Plus className="w-4 h-4 stroke-[2.5]" />
        Criar meu primeiro grupo
      </button>
    </div>
  );
}
