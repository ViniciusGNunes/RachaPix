'use client';

import React, { useState } from 'react';
import { type MemberDto, type ExpenseDto } from '@/lib/api';
import { CATEGORY_LABELS } from '@/lib/formatters';
import { Select } from '@/components/ui/Select';
import { Money } from '@/components/ui/Money';
import { toast } from '@/components/ui/Toast';
import {
  Receipt,
  Edit2,
  Trash2,
  Check,
} from 'lucide-react';
import { useExpenses, useConfirmExpense } from '@/lib/query';
import {
  CATEGORIES,
  CATEGORY_STYLE,
  groupByDay,
  getExpenseStatus,
  errorMessageOr,
} from './groupConstants';
import { StatusPill, DayHeader } from './GroupFeedback';

interface ExpensesTabProps {
  groupId: string;
  members: MemberDto[];
  currentMemberId: string | null;
  isAdmin: boolean;
  canWrite: boolean;
  filterFrom: string;
  filterTo: string;
  filterCategory: string;
  filterMemberId: string;
  onFilterFromChange: (val: string) => void;
  onFilterToChange: (val: string) => void;
  onFilterCategoryChange: (val: string) => void;
  onFilterMemberIdChange: (val: string) => void;
  onClearFilters: () => void;
  onEditExpense: (exp: ExpenseDto) => void;
  onDeleteExpense: (exp: ExpenseDto) => void;
  onContestExpense: (exp: ExpenseDto) => void;
}

export function ExpensesTab({
  groupId,
  members,
  currentMemberId,
  isAdmin,
  canWrite,
  filterFrom,
  filterTo,
  filterCategory,
  filterMemberId,
  onFilterFromChange,
  onFilterToChange,
  onFilterCategoryChange,
  onFilterMemberIdChange,
  onClearFilters,
  onEditExpense,
  onDeleteExpense,
  onContestExpense,
}: Readonly<ExpensesTabProps>) {
  const { data: expenses = [] } = useExpenses(groupId, {
    from: filterFrom || undefined,
    to: filterTo || undefined,
    category: filterCategory || undefined,
    memberId: filterMemberId || undefined,
  });

  const confirmExpenseMutation = useConfirmExpense();
  const [confirmingExpenseId, setConfirmingExpenseId] = useState<string | null>(null);

  const handleConfirmExpense = async (expenseId: string) => {
    try {
      setConfirmingExpenseId(expenseId);
      await confirmExpenseMutation.mutateAsync({
        groupId,
        expenseId,
        data: { status: 'Confirmed' },
      });
      toast.success('Despesa confirmada!');
    } catch (err: unknown) {
      toast.error(errorMessageOr(err, 'Erro ao registrar confirmação.'));
    } finally {
      setConfirmingExpenseId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 text-xs">
        <div>
          <input
            type="date"
            value={filterFrom}
            max={filterTo || undefined}
            onChange={(e) => onFilterFromChange(e.target.value)}
            placeholder="De"
            className="w-full h-11 px-3.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-50 text-base md:text-sm focus:border-accent focus:outline-none transition-colors"
          />
        </div>

        <div>
          <input
            type="date"
            value={filterTo}
            min={filterFrom || undefined}
            onChange={(e) => onFilterToChange(e.target.value)}
            placeholder="Até"
            className="w-full h-11 px-3.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-50 text-base md:text-sm focus:border-accent focus:outline-none transition-colors"
          />
        </div>

        <div>
          <Select
            value={filterCategory}
            onChange={(value) => onFilterCategoryChange(value)}
            options={[{ value: '', label: 'Todas Categorias' }, ...CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))]}
            triggerClassName="px-3 py-1.5 h-11 rounded-xl text-sm"
            className="block sm:inline-block w-full sm:w-auto"
          />
        </div>

        <div>
          <Select
            value={filterMemberId}
            onChange={(value) => onFilterMemberIdChange(value)}
            options={[{ value: '', label: 'Todos Quem Pagou' }, ...members.map((mb) => ({ value: mb.id, label: mb.name }))]}
            triggerClassName="px-3 py-1.5 h-11 rounded-xl text-sm"
            className="block sm:inline-block w-full sm:w-auto"
          />
        </div>

        {(filterFrom || filterTo || filterCategory || filterMemberId) && (
          <button
            type="button"
            onClick={onClearFilters}
            className="col-span-2 h-11 px-3 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-xs font-semibold text-accent transition-all active:scale-[0.98] cursor-pointer sm:ml-auto inline-flex items-center justify-center"
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <div className="p-8 sm:p-12 text-center flex flex-col items-center max-w-sm mx-auto rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300 mb-4 shadow-sm">
            <Receipt className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-zinc-50 text-base">
            Nenhuma despesa encontrada
          </h3>
          <p className="text-sm text-zinc-400 mt-1">
            {canWrite
              ? 'Use "Nova Despesa" para registrar um gasto.'
              : 'Nenhuma despesa registrada neste grupo ainda.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupByDay(expenses).map((g) => (
            <div key={g.key} className="space-y-2">
              <DayHeader label={g.label} />
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 divide-y divide-zinc-800/80 overflow-hidden">
                {g.items.map((exp) => {
                  const Icon = (CATEGORY_STYLE[exp.category] ?? CATEGORY_STYLE.Other).icon;
                  const catCls = (CATEGORY_STYLE[exp.category] ?? CATEGORY_STYLE.Other).cls;
                  const status = getExpenseStatus(exp);
                  const canManageExpense = isAdmin || (!!currentMemberId && exp.createdByMemberId === currentMemberId);
                  const isConfirmer =
                    !!currentMemberId &&
                    exp.shares.some((s) => s.memberId === currentMemberId) &&
                    exp.paidByMemberId !== currentMemberId;
                  const myConf = isConfirmer
                    ? exp.confirmations.find((c) => c.memberId === currentMemberId)
                    : null;

                  return (
                    <div
                      key={exp.id}
                      className="p-3.5 sm:p-4 hover:bg-zinc-900/60 transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <span
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${catCls}`}
                          title={CATEGORY_LABELS[exp.category]}
                        >
                          <Icon className="w-5 h-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-zinc-50 text-sm truncate">
                              {exp.description}
                            </p>
                            {status && (
                              <span title={status.title} className="shrink-0">
                                <StatusPill tone={status.tone}>{status.label}</StatusPill>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 mt-0.5 truncate">
                            Pago por <span className="text-zinc-300 font-medium">{exp.paidByName}</span>
                            {exp.createdByName ? ` · por ${exp.createdByName}` : ''}
                            {exp.updatedByName ? ` (editado por ${exp.updatedByName})` : ''}
                            {exp.notes ? ` · ${exp.notes}` : ''}
                          </p>
                        </div>
                        <div className="text-right shrink-0 text-base sm:text-lg font-bold tabular-nums text-zinc-50">
                          <Money value={exp.amount} />
                        </div>
                        {canManageExpense && (
                          <div className="flex items-center shrink-0 gap-1">
                            <button
                              type="button"
                              onClick={() => onEditExpense(exp)}
                              aria-label="Editar despesa"
                              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors cursor-pointer"
                              title="Editar despesa"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteExpense(exp)}
                              aria-label="Excluir despesa"
                              className="p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Excluir despesa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Seção Confirmar / Contestar para confirmador */}
                      {isConfirmer && (
                        <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] text-zinc-400">Sua confirmação:</span>
                          <button
                            type="button"
                            onClick={() => handleConfirmExpense(exp.id)}
                            disabled={confirmingExpenseId === exp.id || myConf?.status === 'Confirmed'}
                            className={`h-7 px-2.5 rounded-lg text-xs font-medium transition cursor-pointer inline-flex items-center gap-1 ${
                              myConf?.status === 'Confirmed'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            {myConf?.status === 'Confirmed' ? 'Confirmada' : 'Confirmar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onContestExpense(exp)}
                            disabled={confirmingExpenseId === exp.id}
                            className={`h-7 px-2.5 rounded-lg text-xs font-medium transition cursor-pointer inline-flex items-center gap-1 ${
                              myConf?.status === 'Contested'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60'
                            }`}
                          >
                            {myConf?.status === 'Contested' ? 'Contestada' : 'Contestar'}
                          </button>
                          {myConf?.comment && (
                            <span className="text-[11px] text-zinc-400 italic truncate max-w-xs" title={myConf.comment}>
                              &quot;{myConf.comment}&quot;
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
