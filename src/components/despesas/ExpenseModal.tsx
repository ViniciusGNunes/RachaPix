'use client';

import React, { useState, useEffect } from 'react';
import {
  type MemberDto,
  type ExpenseDto,
  type ExpenseCategory,
  type ShareMode,
  type CreateExpenseRequest,
  ApiError,
} from '@/lib/api';
import { formatBRL, CATEGORY_LABELS } from '@/lib/formatters';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { AlertCircle } from 'lucide-react';
import { useCreateExpense, useUpdateExpense } from '@/lib/query';
import { CATEGORIES, isoDay } from './groupConstants';

const SHARE_MODE_LABELS: Record<ShareMode, string> = {
  Equal: 'Igual',
  Custom: 'Valores',
  Percentage: 'Porcentagem',
};

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  members: MemberDto[];
  currentMemberId: string | null;
  expenseToEdit: ExpenseDto | null;
}

type ShareInput = { memberId: string; amount: string; percentage: string; participating: boolean };
type ShareOutput = { memberId: string; amount?: number | null; percentage?: number | null };

const toNumber = (value: string) => Number.parseFloat(value) || 0;

function buildEqualShares(shares: ShareInput[]): { shares: ShareOutput[] } | { error: string } {
  const participating = shares.filter((s) => s.participating);
  if (participating.length === 0) return { error: 'Selecione ao menos um participante na divisão.' };
  return { shares: participating.map((s) => ({ memberId: s.memberId, amount: null, percentage: null })) };
}

function buildCustomShares(shares: ShareInput[], total: number): { shares: ShareOutput[] } | { error: string } {
  if (shares.some((s) => toNumber(s.amount) < 0)) return { error: 'Os valores individuais não podem ser negativos.' };
  const sum = shares.reduce((acc, s) => acc + toNumber(s.amount), 0);
  if (Math.round(sum * 100) !== Math.round(total * 100)) {
    return {
      error: `A soma dos valores individuais (${formatBRL(sum)}) deve ser igual ao total da despesa (${formatBRL(total)}).`,
    };
  }
  return {
    shares: shares.filter((s) => toNumber(s.amount) > 0).map((s) => ({ memberId: s.memberId, amount: toNumber(s.amount) })),
  };
}

function buildPercentageShares(shares: ShareInput[]): { shares: ShareOutput[] } | { error: string } {
  if (shares.some((s) => toNumber(s.percentage) < 0)) return { error: 'As porcentagens não podem ser negativas.' };
  const sum = shares.reduce((acc, s) => acc + toNumber(s.percentage), 0);
  if (Math.abs(sum - 100) > 0.01) return { error: `A soma das porcentagens deve ser 100%. Soma atual: ${sum}%.` };
  return {
    shares: shares
      .filter((s) => toNumber(s.percentage) > 0)
      .map((s) => ({ memberId: s.memberId, percentage: toNumber(s.percentage) })),
  };
}

function buildShares(mode: ShareMode, shares: ShareInput[], total: number): { shares: ShareOutput[] } | { error: string } {
  if (mode === 'Equal') return buildEqualShares(shares);
  if (mode === 'Custom') return buildCustomShares(shares, total);
  return buildPercentageShares(shares);
}

export function ExpenseModal({
  isOpen,
  onClose,
  groupId,
  members,
  currentMemberId,
  expenseToEdit,
}: Readonly<ExpenseModalProps>) {
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmountStr, setExpenseAmountStr] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('Uncategorized');
  const [expensePaidBy, setExpensePaidBy] = useState('');
  const [expenseShareMode, setExpenseShareMode] = useState<ShareMode>('Equal');
  const [expenseShares, setExpenseShares] = useState<
    { memberId: string; amount: string; percentage: string; participating: boolean }[]
  >([]);
  const [expenseNotes, setExpenseNotes] = useState('');
  const [expenseFormError, setExpenseFormError] = useState<string | null>(null);

  const createExpenseMutation = useCreateExpense();
  const updateExpenseMutation = useUpdateExpense();
  const savingExpense = createExpenseMutation.isPending || updateExpenseMutation.isPending;

  useEffect(() => {
    if (!isOpen) return;

    if (expenseToEdit) {
      setExpenseDesc(expenseToEdit.description);
      setExpenseAmountStr(expenseToEdit.amount.toString());
      setExpenseDate(expenseToEdit.date);
      setExpenseCategory(expenseToEdit.category);
      setExpensePaidBy(expenseToEdit.paidByMemberId);
      setExpenseShareMode(expenseToEdit.shareMode);
      setExpenseNotes(expenseToEdit.notes || '');

      const shareMap = new Map(expenseToEdit.shares.map((s) => [s.memberId, s]));
      setExpenseShares(
        members.map((m) => {
          const found = shareMap.get(m.id);
          return {
            memberId: m.id,
            amount: found ? found.amount.toString() : '',
            percentage: found?.percentage ? found.percentage.toString() : '',
            participating: !!found,
          };
        })
      );
    } else {
      setExpenseDesc('');
      setExpenseAmountStr('');
      setExpenseDate(isoDay(new Date()));
      setExpenseCategory('Uncategorized');
      setExpensePaidBy(currentMemberId || members[0]?.id || '');
      setExpenseShares(
        members.map((m) => ({
          memberId: m.id,
          amount: '',
          percentage: '',
          participating: true,
        }))
      );
      setExpenseShareMode('Equal');
      setExpenseNotes('');
    }
    setExpenseFormError(null);
  }, [isOpen, expenseToEdit, members, currentMemberId]);

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseFormError(null);

    const total = Number.parseFloat(expenseAmountStr) || 0;
    if (!expenseDesc.trim()) {
      setExpenseFormError('A descrição é obrigatória.');
      return;
    }
    if (total <= 0) {
      setExpenseFormError('O valor deve ser maior que zero.');
      return;
    }
    if (!expensePaidBy) {
      setExpenseFormError('Selecione quem pagou a despesa.');
      return;
    }

    const built = buildShares(expenseShareMode, expenseShares, total);
    if ("error" in built) {
      setExpenseFormError(built.error);
      return;
    }
    const payloadShares = built.shares;

    try {
      const payload: CreateExpenseRequest = {
        description: expenseDesc.trim(),
        amount: total,
        date: expenseDate,
        category: expenseCategory,
        paidByMemberId: expensePaidBy,
        shareMode: expenseShareMode,
        shares: payloadShares,
        notes: expenseNotes.trim() || null,
      };

      if (expenseToEdit) {
        await updateExpenseMutation.mutateAsync({
          groupId,
          expenseId: expenseToEdit.id,
          data: payload,
        });
      } else {
        await createExpenseMutation.mutateAsync({
          groupId,
          data: payload,
        });
      }

      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setExpenseFormError(err.message);
      } else {
        setExpenseFormError('Erro ao salvar despesa.');
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={expenseToEdit ? 'Editar Despesa' : 'Nova Despesa'}
      description="Registre os detalhes e como o valor será distribuído entre os membros."
      maxWidth="xl"
    >
      <form onSubmit={handleSaveExpense} className="space-y-3.5" noValidate>
        {expenseFormError && (
          <div
            role="alert"
            className="p-3 rounded-md border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{expenseFormError}</span>
          </div>
        )}

        {expenseToEdit && (expenseToEdit.createdByName || expenseToEdit.updatedByName) && (
          <div className="p-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-xs text-zinc-400">
            {expenseToEdit.createdByName && (
              <span>Criada por <strong className="text-zinc-200">{expenseToEdit.createdByName}</strong></span>
            )}
            {expenseToEdit.updatedByName && (
              <span> · Editada por <strong className="text-zinc-200">{expenseToEdit.updatedByName}</strong></span>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label htmlFor="expense-desc" className="block text-[13px] font-medium text-zinc-400 mb-1">
              Descrição *
            </label>
            <input
              id="expense-desc"
              type="text"
              required
              placeholder="Ex: Compras no Supermercado, Aluguel, Combustível"
              value={expenseDesc}
              onChange={(e) => setExpenseDesc(e.target.value)}
              className="w-full h-10 sm:h-9 px-3 rounded-md border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm placeholder:text-zinc-400 focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="expense-amount" className="block text-[13px] font-medium text-zinc-400 mb-1">
              Valor Total (R$) *
            </label>
            <input
              id="expense-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              value={expenseAmountStr}
              onChange={(e) => setExpenseAmountStr(e.target.value)}
              className="w-full h-10 sm:h-9 px-3 rounded-md border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm font-semibold tabular-nums placeholder:text-zinc-400 focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="expense-date" className="block text-[13px] font-medium text-zinc-400 mb-1">
              Data *
            </label>
            <input
              id="expense-date"
              type="date"
              required
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full h-10 sm:h-9 px-3 rounded-md border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <div>
            <span className="block text-[13px] font-medium text-zinc-400 mb-1">
              Categoria *
            </span>
            <Select
              value={expenseCategory}
              onChange={(value) => setExpenseCategory(value as ExpenseCategory)}
              options={CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
              triggerClassName="px-3 py-1.5 h-10 sm:h-9 rounded-md text-sm"
            />
          </div>

          <div>
            <span className="block text-[13px] font-medium text-zinc-400 mb-1">
              Quem Pagou? *
            </span>
            <Select
              value={expensePaidBy}
              onChange={(value) => setExpensePaidBy(value)}
              options={members.map((mb) => ({ value: mb.id, label: mb.name }))}
              triggerClassName="px-3 py-1.5 h-10 sm:h-9 rounded-md text-sm font-medium"
            />
          </div>
        </div>

        {/* Division Mode */}
        <div className="pt-1.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-zinc-400">
              Divisão entre Membros *
            </span>
            <div className="inline-flex p-0.5 rounded-md bg-zinc-950 border border-zinc-800 gap-0.5">
              {(['Equal', 'Custom', 'Percentage'] as ShareMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setExpenseShareMode(mode)}
                  className={`px-2.5 py-1 rounded-sm text-xs font-medium transition cursor-pointer ${
                    expenseShareMode === mode
                      ? 'bg-zinc-800 text-zinc-100 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  {SHARE_MODE_LABELS[mode]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {expenseShares.map((s) => {
              const member = members.find((m) => m.id === s.memberId);
              if (!member) return null;

              return (
                <div
                  key={s.memberId}
                  className="flex items-center justify-between p-2 rounded-md bg-zinc-950 border border-zinc-800 text-xs"
                >
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    {expenseShareMode === 'Equal' && (
                      <input
                        type="checkbox"
                        checked={s.participating}
                        onChange={(e) =>
                          setExpenseShares((prev) =>
                            prev.map((item) =>
                              item.memberId === s.memberId
                                ? { ...item, participating: e.target.checked }
                                : item
                            )
                          )
                        }
                        className="w-3.5 h-3.5 rounded accent-[var(--accent)] cursor-pointer"
                      />
                    )}
                    <span className="font-medium text-zinc-200">
                      {member.name}
                    </span>
                  </label>

                  {expenseShareMode === 'Custom' && (
                    <div className="flex items-center gap-1.5 w-32">
                      <span className="text-zinc-400 font-medium">R$</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={s.amount}
                        onChange={(e) =>
                          setExpenseShares((prev) =>
                            prev.map((item) =>
                              item.memberId === s.memberId
                                ? { ...item, amount: e.target.value }
                                : item
                            )
                          )
                        }
                        className="w-full h-7 px-2 rounded-sm border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm text-right font-semibold tabular-nums focus:border-accent focus:outline-none"
                      />
                    </div>
                  )}

                  {expenseShareMode === 'Percentage' && (
                    <div className="flex items-center gap-1.5 w-24">
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="0"
                        value={s.percentage}
                        onChange={(e) =>
                          setExpenseShares((prev) =>
                            prev.map((item) =>
                              item.memberId === s.memberId
                                ? { ...item, percentage: e.target.value }
                                : item
                            )
                          )
                        }
                        className="w-full h-7 px-2 rounded-sm border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm text-right font-semibold tabular-nums focus:border-accent focus:outline-none"
                      />
                      <span className="text-zinc-400 font-medium">%</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="expense-notes" className="block text-[13px] font-medium text-zinc-400 mb-1">
            Observações (opcional)
          </label>
          <input
            id="expense-notes"
            type="text"
            placeholder="Ex: Compra parcelada, cupom aplicado..."
            value={expenseNotes}
            onChange={(e) => setExpenseNotes(e.target.value)}
            className="w-full h-10 sm:h-9 px-3 rounded-md border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm placeholder:text-zinc-400 focus:border-accent focus:outline-none transition-colors"
          />
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
            disabled={savingExpense}
            className="h-10 sm:h-9 px-4 rounded-md bg-accent hover:bg-accent-hover text-accent-fg font-medium text-sm transition-colors shadow-sm cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {savingExpense ? 'Salvando...' : 'Salvar Despesa'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
