import React from 'react';
import { Modal } from '@/components/ui/Modal';

interface SplitDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  splitTitle: string;
  actionError: string | null;
  isDeleting: boolean;
  onDelete: () => void;
}

export function SplitDeleteModal({
  isOpen,
  onClose,
  splitTitle,
  actionError,
  isDeleting,
  onDelete,
}: SplitDeleteModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Excluir este Racha?"
      maxWidth="md"
    >
      <div className="space-y-4">
        {actionError && (
          <p role="alert" className="text-sm text-rose-300">{actionError}</p>
        )}

        <p className="text-sm text-zinc-400">
          Tem certeza que deseja excluir &quot;{splitTitle}&quot;? Esta ação removerá os links públicos e não pode ser desfeita.
        </p>
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 h-11 text-sm font-semibold text-zinc-300 hover:bg-zinc-900 rounded-xl cursor-pointer transition active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onDelete}
            className="px-4 h-11 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition active:scale-[0.98] cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
