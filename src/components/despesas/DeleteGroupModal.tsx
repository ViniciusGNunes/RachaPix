'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { type GroupDto, ApiError } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { AlertCircle } from 'lucide-react';
import { useDeleteGroup } from '@/lib/query';
import { removeSavedGroup } from '@/lib/storage';

interface DeleteGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: GroupDto;
}

export function DeleteGroupModal({
  isOpen,
  onClose,
  group,
}: Readonly<DeleteGroupModalProps>) {
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const router = useRouter();
  const deleteGroupMutation = useDeleteGroup();

  const handleConfirmDelete = async () => {
    try {
      setDeleteError(null);
      await deleteGroupMutation.mutateAsync(group.id);
      removeSavedGroup(group.id);
      router.push('/despesas');
    } catch (err: unknown) {
      setDeleteError(err instanceof ApiError ? err.message : 'Erro ao excluir grupo.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setDeleteError(null);
      }}
      title="Excluir Grupo de Despesas"
      maxWidth="md"
    >
      <div className="space-y-4">
        {deleteError && (
          <div
            role="alert"
            className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{deleteError}</span>
          </div>
        )}

        <p className="text-sm text-zinc-300 leading-relaxed">
          Tem certeza absoluta que deseja excluir o grupo <strong>{group.name}</strong> e todo o seu histórico de despesas e acertos? Esta ação não pode ser desfeita.
        </p>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={() => {
              onClose();
              setDeleteError(null);
            }}
            className="h-11 px-4 rounded-xl border border-zinc-800 text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800/60 font-semibold text-sm transition-colors active:scale-[0.98] cursor-pointer inline-flex items-center justify-center"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={deleteGroupMutation.isPending}
            onClick={handleConfirmDelete}
            className="h-11 px-5 rounded-xl border border-rose-500/40 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold text-sm transition-colors active:scale-[0.98] cursor-pointer disabled:opacity-50 inline-flex items-center justify-center shadow-sm"
          >
            {deleteGroupMutation.isPending ? 'Excluindo...' : 'Sim, excluir grupo definitivamente'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
