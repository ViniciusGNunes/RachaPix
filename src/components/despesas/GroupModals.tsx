'use client';

import React from 'react';
import { type GroupDto } from '@/lib/api';
import { type GroupModalsState } from '@/hooks/useGroupModals';
import { ExpenseModal } from '@/components/despesas/ExpenseModal';
import { ContestExpenseModal } from '@/components/despesas/ContestExpenseModal';
import { DeleteExpenseModal } from '@/components/despesas/DeleteExpenseModal';
import { SettlementModal } from '@/components/despesas/SettlementModal';
import { DeleteSettlementModal } from '@/components/despesas/DeleteSettlementModal';
import { MemberModal } from '@/components/despesas/MemberModal';
import { DeleteMemberModal } from '@/components/despesas/DeleteMemberModal';
import { GroupSettingsModal } from '@/components/despesas/GroupSettingsModal';
import { DeleteGroupModal } from '@/components/despesas/DeleteGroupModal';

interface GroupModalsProps {
  group: GroupDto;
  currentMemberId: string | null;
  isAdmin: boolean;
  modals: GroupModalsState;
}

export function GroupModals({
  group,
  currentMemberId,
  isAdmin,
  modals,
}: Readonly<GroupModalsProps>) {
  return (
    <>
      <ExpenseModal
        isOpen={modals.expenseModalOpen}
        onClose={modals.closeExpenseModal}
        groupId={group.id}
        members={group.members}
        currentMemberId={currentMemberId}
        expenseToEdit={modals.expenseToEdit}
      />

      <ContestExpenseModal
        expense={modals.contestTarget}
        onClose={modals.closeContestModal}
        groupId={group.id}
      />

      <DeleteExpenseModal
        expense={modals.expenseToDelete}
        onClose={modals.closeDeleteExpenseModal}
        groupId={group.id}
      />

      <SettlementModal
        isOpen={modals.settlementModalOpen}
        onClose={modals.closeSettlementModal}
        groupId={group.id}
        members={group.members}
        currentMemberId={currentMemberId}
        isAdmin={isAdmin}
        initialData={modals.settlementInitialData}
      />

      <DeleteSettlementModal
        settlement={modals.settlementToDelete}
        onClose={modals.closeDeleteSettlementModal}
        groupId={group.id}
        currentMemberId={currentMemberId}
      />

      <MemberModal
        isOpen={modals.memberModalOpen}
        onClose={modals.closeMemberModal}
        groupId={group.id}
        memberToEdit={modals.memberToEdit}
      />

      <DeleteMemberModal
        member={modals.memberToDelete}
        onClose={modals.closeDeleteMemberModal}
        groupId={group.id}
      />

      <GroupSettingsModal
        isOpen={modals.groupSettingsModalOpen}
        onClose={modals.closeSettings}
        group={group}
        onOpenDeleteConfirm={modals.openDeleteGroupConfirm}
      />

      <DeleteGroupModal
        isOpen={modals.groupDeleteConfirmOpen}
        onClose={modals.closeDeleteGroupConfirm}
        group={group}
      />
    </>
  );
}
