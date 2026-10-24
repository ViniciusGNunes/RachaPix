'use client';

import React, { useState, useEffect } from 'react';
import { type MemberDto, type CreateSettlementRequest, ApiError } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { toast } from '@/components/ui/Toast';
import { AlertCircle } from 'lucide-react';
import { useCreateSettlement } from '@/lib/query';
import { isoDay } from './groupConstants';

export interface SettlementInitialData {
  fromId?: string;
  toId?: string;
  amount?: number;
}

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  members: MemberDto[];
  currentMemberId: string | null;
  isAdmin: boolean;
  initialData?: SettlementInitialData | null;
}

export function SettlementModal({
  isOpen,
  onClose,
  groupId,
  members,
  currentMemberId,
  isAdmin,
  initialData,
}: Readonly<SettlementModalProps>) {
  const [settlementFrom, setSettlementFrom] = useState('');
  const [settlementTo, setSettlementTo] = useState('');
  const [settlementAmountStr, setSettlementAmountStr] = useState('');
  const [settlementDate, setSettlementDate] = useState('');
  const [settlementNotes, setSettlementNotes] = useState('');
  const [settlementError, setSettlementError] = useState<string | null>(null);

  const createSettlementMutation = useCreateSettlement();

  useEffect(() => {
    if (!isOpen) return;

    let initialFrom = initialData?.fromId;
    let initialTo = initialData?.toId;

    if (!initialFrom) {
      initialFrom = currentMemberId || (members[0]?.id ?? '');
    }

    if (!initialTo) {
      const other = members.find((m) => m.id !== initialFrom);
      initialTo = other?.id ?? '';
    }

    if (!isAdmin && currentMemberId) {
      if (initialFrom !== currentMemberId && initialTo !== currentMemberId) {
        initialFrom = currentMemberId;
        const other = members.find((m) => m.id !== currentMemberId);
        initialTo = other?.id ?? '';
      }
    }

    setSettlementFrom(initialFrom);
    setSettlementTo(initialTo);
    setSettlementAmountStr(initialData?.amount ? initialData.amount.toString() : '');
    setSettlementDate(isoDay(new Date()));
    setSettlementNotes('');
    setSettlementError(null);
  }, [isOpen, initialData, currentMemberId, isAdmin, members]);

  const handleSaveSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettlementError(null);

    const amount = Number.parseFloat(settlementAmountStr) || 0;
    if (amount <= 0) {
      setSettlementError('O valor deve ser maior que zero.');
      return;
    }
    if (!settlementFrom || !settlementTo) {
      setSettlementError('Selecione quem pagou e quem recebeu.');
      return;
    }
    if (settlementFrom === settlementTo) {
      setSettlementError('Quem paga e quem recebe devem ser membros diferentes.');
      return;
    }
    if (!isAdmin && currentMemberId && settlementFrom !== currentMemberId && settlementTo !== currentMemberId) {
      setSettlementError('Você só pode registrar acertos em que você paga ou recebe.');
      return;
    }

    try {
      const payload: CreateSettlementRequest = {
        fromMemberId: settlementFrom,
        toMemberId: settlementTo,
        amount,
        date: settlementDate,
        notes: settlementNotes.trim() || null,
      };

      await createSettlementMutation.mutateAsync({
        groupId,
        data: payload,
      });

      toast.success('Acerto registrado com sucesso!');
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) setSettlementError(err.message);
      else setSettlementError('Erro ao registrar acerto.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Acerto de Contas"
      description="Registre uma transferência de dinheiro entre membros para abater saldos."
      maxWidth="md"
    >
      <form onSubmit={handleSaveSettlement} className="space-y-3.5" noValidate>
        {settlementError && (
          <div
            role="alert"
            className="p-3 rounded-md border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{settlementError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="block text-[13px] font-medium text-zinc-400 mb-1">
              Quem Pagou (Devedor) *
            </span>
            <Select
              value={settlementFrom}
              onChange={(value) => {
                setSettlementFrom(value);
                if (!isAdmin && currentMemberId && value !== currentMemberId) {
                  setSettlementTo(currentMemberId);
                }
              }}
              options={members
                .filter((mb) => isAdmin || !currentMemberId || settlementTo === currentMemberId || mb.id === currentMemberId)
                .map((mb) => ({ value: mb.id, label: mb.name }))}
              triggerClassName="px-3 py-1.5 h-10 sm:h-9 rounded-md text-sm"
            />
          </div>

          <div>
            <span className="block text-[13px] font-medium text-zinc-400 mb-1">
              Quem Recebeu (Credor) *
            </span>
            <Select
              value={settlementTo}
              onChange={(value) => {
                setSettlementTo(value);
                if (!isAdmin && currentMemberId && value !== currentMemberId) {
                  setSettlementFrom(currentMemberId);
                }
              }}
              options={members
                .filter((mb) => isAdmin || !currentMemberId || settlementFrom === currentMemberId || mb.id === currentMemberId)
                .map((mb) => ({ value: mb.id, label: mb.name }))}
              triggerClassName="px-3 py-1.5 h-10 sm:h-9 rounded-md text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="settlement-amount" className="block text-[13px] font-medium text-zinc-400 mb-1">
              Valor (R$) *
            </label>
            <input
              id="settlement-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              value={settlementAmountStr}
              onChange={(e) => setSettlementAmountStr(e.target.value)}
              className="w-full h-10 sm:h-9 px-3 rounded-md border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm font-semibold tabular-nums placeholder:text-zinc-400 focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="settlement-date" className="block text-[13px] font-medium text-zinc-400 mb-1">
              Data *
            </label>
            <input
              id="settlement-date"
              type="date"
              required
              value={settlementDate}
              onChange={(e) => setSettlementDate(e.target.value)}
              className="w-full h-10 sm:h-9 px-3 rounded-md border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm focus:border-accent focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label htmlFor="settlement-notes" className="block text-[13px] font-medium text-zinc-400 mb-1">
            Observações (opcional)
          </label>
          <input
            id="settlement-notes"
            type="text"
            placeholder="Ex: Pix comprovante enviado no WhatsApp"
            value={settlementNotes}
            onChange={(e) => setSettlementNotes(e.target.value)}
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
            disabled={createSettlementMutation.isPending}
            className="h-10 sm:h-9 px-4 rounded-md bg-accent hover:bg-accent-hover text-accent-fg font-medium text-sm transition-colors shadow-sm cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {createSettlementMutation.isPending ? 'Registrando...' : 'Confirmar Acerto'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
