import { useState } from 'react';
import { type ExpenseDto, type SettlementDto, type MemberDto } from '@/lib/api';
import { type SettlementInitialData } from '@/components/despesas/SettlementModal';

export function useGroupModals() {
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<ExpenseDto | null>(null);
  const [contestTarget, setContestTarget] = useState<ExpenseDto | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseDto | null>(null);
  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [settlementInitialData, setSettlementInitialData] = useState<SettlementInitialData | null>(null);
  const [settlementToDelete, setSettlementToDelete] = useState<SettlementDto | null>(null);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<MemberDto | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<MemberDto | null>(null);
  const [groupSettingsModalOpen, setGroupSettingsModalOpen] = useState(false);
  const [groupDeleteConfirmOpen, setGroupDeleteConfirmOpen] = useState(false);

  return {
    expenseModalOpen,
    expenseToEdit,
    contestTarget,
    expenseToDelete,
    settlementModalOpen,
    settlementInitialData,
    settlementToDelete,
    memberModalOpen,
    memberToEdit,
    memberToDelete,
    groupSettingsModalOpen,
    groupDeleteConfirmOpen,
    openNewExpense: () => {
      setExpenseToEdit(null);
      setExpenseModalOpen(true);
    },
    openEditExpense: (exp: ExpenseDto) => {
      setExpenseToEdit(exp);
      setExpenseModalOpen(true);
    },
    closeExpenseModal: () => {
      setExpenseModalOpen(false);
      setExpenseToEdit(null);
    },
    openContestExpense: (exp: ExpenseDto) => setContestTarget(exp),
    closeContestModal: () => setContestTarget(null),
    openDeleteExpense: (exp: ExpenseDto) => setExpenseToDelete(exp),
    closeDeleteExpenseModal: () => setExpenseToDelete(null),
    openSettlement: (init?: SettlementInitialData | null) => {
      setSettlementInitialData(init ?? null);
      setSettlementModalOpen(true);
    },
    closeSettlementModal: () => {
      setSettlementModalOpen(false);
      setSettlementInitialData(null);
    },
    openDeleteSettlement: (st: SettlementDto) => setSettlementToDelete(st),
    closeDeleteSettlementModal: () => setSettlementToDelete(null),
    openMemberModal: (m?: MemberDto | null) => {
      setMemberToEdit(m ?? null);
      setMemberModalOpen(true);
    },
    closeMemberModal: () => {
      setMemberModalOpen(false);
      setMemberToEdit(null);
    },
    openDeleteMember: (m: MemberDto) => setMemberToDelete(m),
    closeDeleteMemberModal: () => setMemberToDelete(null),
    openSettings: () => setGroupSettingsModalOpen(true),
    closeSettings: () => setGroupSettingsModalOpen(false),
    openDeleteGroupConfirm: () => setGroupDeleteConfirmOpen(true),
    closeDeleteGroupConfirm: () => setGroupDeleteConfirmOpen(false),
  };
}

export type GroupModalsState = ReturnType<typeof useGroupModals>;
