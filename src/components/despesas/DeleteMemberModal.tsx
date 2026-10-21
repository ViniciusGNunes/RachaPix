'use client';

import React, { useState, useEffect } from 'react';
import { type MemberDto, ApiError } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { AlertCircle } from 'lucide-react';
import { useDeleteMember } from '@/lib/query';
import { errorMessageOr } from './groupConstants';

interface DeleteMemberModalProps {
  member: MemberDto | null;
  onClose: () => void;
  groupId: string;
}

export function DeleteMemberModal({
  member,
  onClose,
  groupId,
}: Readonly<DeleteMemberModalProps>) {
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteMemberMutation = useDeleteMember();

  useEffect(() => {
    if (member) {
      setDeleteError(null);
    }
  }, [member]);

  const handleConfirmDelete = async () => {
    if (!member) return;
    try {
      setDeleteError(null);
      await deleteMemberMutation.mutateAsync({
        groupId,
        memberId: member.id,
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409) {
        setDeleteError(
          'Não é possível remover este membro pois ele já possui despesas ou acertos vinculados no grupo (Erro 409: Conflito).'
        );
      } else {
        setDeleteError(errorMessageOr(err, 'Falha ao remover membro.'));
      }
    }
  };

  return (
    <Modal
      isOpen={!!member}
      onClose={onClose}
      title="Remover Membro do Grupo"
      maxWidth="md"
    >
      <div className="space-y-4">
        {deleteError && (
          <div
            role="alert"
            className="p-3 rounded-md border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{deleteError}</span>
          </div>
        )}

        <p className="text-sm text-zinc-300 leading-relaxed">
          Deseja realmente remover <strong>{member?.name}</strong> do grupo?
        </p>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="h-10 sm:h-9 px-3.5 rounded-md border border-zinc-800 text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800 font-medium text-sm transition-colors cursor-pointer inline-flex items-center justify-center"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={deleteMemberMutation.isPending}
            onClick={handleConfirmDelete}
            className="h-10 sm:h-9 px-3.5 rounded-md border border-rose-500/40 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-medium text-sm transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center justify-center shadow-sm"
          >
            {deleteMemberMutation.isPending ? 'Removendo...' : 'Confirmar Remoção'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
