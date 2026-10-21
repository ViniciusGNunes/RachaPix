import React from 'react';
import { Plus } from 'lucide-react';

interface LobbyHeaderProps {
  onOpenCreateModal: () => void;
}

export function LobbyHeader({ onOpenCreateModal }: Readonly<LobbyHeaderProps>) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-2xl font-semibold tracking-tight text-zinc-50">
          Grupos
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Gerencie despesas compartilhadas e acertos de contas
        </p>
      </div>

      <button
        type="button"
        onClick={onOpenCreateModal}
        className="fixed right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 sm:static inline-flex items-center justify-center gap-2 h-10 sm:h-9 px-4 sm:px-3.5 rounded-md bg-accent hover:bg-accent-hover text-accent-fg font-medium text-sm transition-colors cursor-pointer shadow-sm"
      >
        <Plus className="w-4 h-4 stroke-[2.5]" />
        <span>Novo Grupo</span>
      </button>
    </div>
  );
}
