'use client';

import React, { useState, useEffect } from 'react';
import { type ExpenseDto } from '@/lib/api';
import { formatBRL } from '@/lib/formatters';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { AlertCircle } from 'lucide-react';
import { useDeleteExpense } from '@/lib/query';
import { errorMessageOr } from './groupConstants';

interface DeleteExpenseModalProps {
  expense: ExpenseDto | null;
  onClose: () => void;
  groupId: string;
}

export function DeleteExpenseModal({
  expense,
  onClose,
  groupId,
}: Readonly<DeleteExpenseModalProps>) {
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteExpenseMutation = useDeleteExpense();

  useEffect(() => {
    if (expense) {
      setDeleteError(null);
    }
  }, [expense]);

  const handleConfirmDelete = async () => {
    if (!expense) return;
    try {
      setDeleteError(null);
      await deleteExpenseMutation.mutateAsync({
        groupId,
        expenseId: expense.id,
      });
      toast.success('Despesa excluída com sucesso!');
      onClose();
    } catch (err: unknown) {
      setDeleteError(errorMessageOr(err, 'Falha ao excluir despesa.'));
    }
  };

  return (
    <Modal
      isOpen={!!expense}
      onClose={onClose}
      title="Excluir Despesa"
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
          Deseja realmente excluir a despesa <strong>{expense?.description}</strong> no valor de <strong>{expense ? formatBRL(expense.amount) : ''}</strong>?
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
            disabled={deleteExpenseMutation.isPending}
            onClick={handleConfirmDelete}
            className="h-10 sm:h-9 px-3.5 rounded-md border border-rose-500/40 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-medium text-sm transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center justify-center shadow-sm"
          >
            {deleteExpenseMutation.isPending ? 'Excluindo...' : 'Confirmar Exclusão'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
