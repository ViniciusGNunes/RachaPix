'use client';

import React, { useState, useEffect } from 'react';
import { type SettlementDto } from '@/lib/api';
import { formatBRL } from '@/lib/formatters';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { AlertCircle } from 'lucide-react';
import { useDeleteSettlement } from '@/lib/query';
import { errorMessageOr } from './groupConstants';

interface DeleteSettlementModalProps {
  settlement: SettlementDto | null;
  onClose: () => void;
  groupId: string;
  currentMemberId: string | null;
}

export function DeleteSettlementModal({
  settlement,
  onClose,
  groupId,
  currentMemberId,
}: Readonly<DeleteSettlementModalProps>) {
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteSettlementMutation = useDeleteSettlement();

  useEffect(() => {
    if (settlement) {
      setDeleteError(null);
    }
  }, [settlement]);

  const isRefusal = settlement?.status === 'Pending' && currentMemberId === settlement.toMemberId;

  let buttonLabel = 'Confirmar Exclusão';
  if (deleteSettlementMutation.isPending) {
    buttonLabel = 'Processando...';
  } else if (isRefusal) {
    buttonLabel = 'Confirmar Recusa';
  }

  const handleConfirmDelete = async () => {
    if (!settlement) return;
    try {
      setDeleteError(null);
      await deleteSettlementMutation.mutateAsync({
        groupId,
        settlementId: settlement.id,
      });
      toast.success(isRefusal ? 'Pagamento recusado!' : 'Acerto excluído com sucesso!');
      onClose();
    } catch (err: unknown) {
      setDeleteError(errorMessageOr(err, 'Falha ao excluir acerto.'));
    }
  };

  return (
    <Modal
      isOpen={!!settlement}
      onClose={onClose}
      title={isRefusal ? 'Recusar Pagamento' : 'Excluir Registro de Acerto'}
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
          {isRefusal ? (
            <>
              Deseja recusar o pagamento de{' '}
              <strong>{settlement ? formatBRL(settlement.amount) : ''}</strong> feito por{' '}
              <strong>{settlement?.fromName}</strong>?
            </>
          ) : (
            <>
              Deseja realmente excluir o acerto de{' '}
              <strong>{settlement ? formatBRL(settlement.amount) : ''}</strong> pago por{' '}
              <strong>{settlement?.fromName}</strong> para{' '}
              <strong>{settlement?.toName}</strong>?
            </>
          )}
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
            disabled={deleteSettlementMutation.isPending}
            onClick={handleConfirmDelete}
            className="h-10 sm:h-9 px-3.5 rounded-md border border-rose-500/40 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-medium text-sm transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center justify-center shadow-sm"
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
