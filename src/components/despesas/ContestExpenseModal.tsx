'use client';

import React, { useState, useEffect } from 'react';
import { type ExpenseDto } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { useConfirmExpense } from '@/lib/query';
import { errorMessageOr } from './groupConstants';

interface ContestExpenseModalProps {
  expense: ExpenseDto | null;
  onClose: () => void;
  groupId: string;
}

export function ContestExpenseModal({
  expense,
  onClose,
  groupId,
}: Readonly<ContestExpenseModalProps>) {
  const [contestComment, setContestComment] = useState('');
  const confirmExpenseMutation = useConfirmExpense();

  useEffect(() => {
    if (expense) {
      setContestComment('');
    }
  }, [expense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expense) return;

    try {
      await confirmExpenseMutation.mutateAsync({
        groupId,
        expenseId: expense.id,
        data: {
          status: 'Contested',
          comment: contestComment.trim() || null,
        },
      });
      toast.success('Despesa contestada!');
      onClose();
    } catch (err: unknown) {
      toast.error(errorMessageOr(err, 'Erro ao registrar contestação.'));
    }
  };

  return (
    <Modal
      isOpen={!!expense}
      onClose={onClose}
      title="Contestar Despesa"
      description={
        expense
          ? `Contestar o valor ou divisão de "${expense.description}".`
          : undefined
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label htmlFor="contest-comment-input" className="block text-[13px] font-medium text-zinc-400 mb-1">
            Motivo da contestação (opcional)
          </label>
          <textarea
            id="contest-comment-input"
            maxLength={200}
            rows={3}
            value={contestComment}
            onChange={(e) => setContestComment(e.target.value)}
            placeholder="Ex: Não consumi esse item ou a divisão de valores está incorreta"
            className="w-full p-2.5 rounded-md border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm placeholder:text-zinc-400 focus:border-accent focus:outline-none transition-colors resize-none"
          />
          <span className="block text-right text-xs text-zinc-400 mt-1">
            {contestComment.length}/200 caracteres
          </span>
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="h-10 sm:h-9 px-3.5 rounded-md border border-zinc-800 text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800 font-medium text-sm transition-colors cursor-pointer inline-flex items-center justify-center"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={confirmExpenseMutation.isPending}
            className="h-10 sm:h-9 px-4 rounded-md bg-amber-500 hover:bg-amber-600 text-zinc-950 font-medium text-sm transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center justify-center"
          >
            {confirmExpenseMutation.isPending ? 'Enviando...' : 'Confirmar Contestação'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
