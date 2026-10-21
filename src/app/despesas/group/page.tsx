'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import { describeThisDevice } from '@/lib/device';
import { saveGroup } from '@/lib/storage';
import {
  useGroup,
  useExpenses,
  useSettlements,
  useStats,
  useClaimMember,
  useRotateInvite,
} from '@/lib/query';
import { useGroupSession } from '@/hooks/useGroupSession';
import { useGroupModals } from '@/hooks/useGroupModals';
import { useGroupFilters } from '@/hooks/useGroupFilters';
import { IdentityPicker } from '@/components/despesas/IdentityPicker';
import {
  type TabType,
  errorMessageOr,
} from '@/components/despesas/groupConstants';
import { GroupHeader } from '@/components/despesas/GroupHeader';
import { GroupModals } from '@/components/despesas/GroupModals';
import { GroupLoadingSkeleton, GroupNotFound } from '@/components/despesas/GroupFeedback';
import { ExpensesTab } from '@/components/despesas/ExpensesTab';
import { BalancesTab } from '@/components/despesas/BalancesTab';
import { SettlementsTab } from '@/components/despesas/SettlementsTab';
import { StatsTab } from '@/components/despesas/StatsTab';
import { MembersTab } from '@/components/despesas/MembersTab';
import { RefreshCw, ArrowLeft } from 'lucide-react';

const TAB_LABELS: Record<TabType, string> = {
  expenses: 'Extrato',
  balances: 'Saldos',
  settlements: 'Pagamentos',
  stats: 'Resumo',
  members: 'Membros',
};

function GroupDetailContent() {
  const groupId = useSearchParams().get('id') ?? '';
  const { data: group, isLoading, error } = useGroup(groupId);
  useGroupSession(groupId, group, error);
  const modals = useGroupModals();
  const filters = useGroupFilters();

  const [activeTab, setActiveTab] = useState<TabType>('expenses');

  const { data: expenses = [] } = useExpenses(groupId, {
    from: filters.filterFrom || undefined,
    to: filters.filterTo || undefined,
    category: filters.filterCategory || undefined,
    memberId: filters.filterMemberId || undefined,
  });
  const { data: settlements = [] } = useSettlements(groupId);
  const { data: stats } = useStats(groupId, {
    from: filters.filterFrom || undefined,
    to: filters.filterTo || undefined,
  });

  const claimMemberMutation = useClaimMember();
  const rotateInviteMutation = useRotateInvite();

  const me = group?.yourMemberId ?? null;
  const isAdmin = group?.isAdmin ?? false;
  const canWrite = !!me || isAdmin;

  const handleClaim = async (req: { memberId?: string; newName?: string }) => {
    try {
      const res = await claimMemberMutation.mutateAsync({
        groupId,
        data: { ...req, label: describeThisDevice() },
      });
      saveGroup({ id: groupId, memberToken: res.memberToken, memberId: res.member.id });
    } catch (err: unknown) {
      if (err instanceof ApiError) throw new Error(err.message);
      throw err;
    }
  };

  const handleRotateInvite = async () => {
    try {
      const res = await rotateInviteMutation.mutateAsync(groupId);
      saveGroup({ id: groupId, accessToken: res.accessToken });
      toast.success('Novo link de convite gerado com sucesso!');
    } catch (err: unknown) {
      toast.error(errorMessageOr(err, 'Erro ao gerar novo convite.'));
    }
  };

  if (isLoading && !group) return <GroupLoadingSkeleton />;
  if (error || !group) return <GroupNotFound error={error} />;

  if (!group.yourMemberId) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 lg:pt-4 pb-28 lg:pb-12 w-full animate-fade-up">
        <Link
          href="/despesas"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-50 transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Grupos
        </Link>
        <IdentityPicker groupName={group.name} members={group.members} onClaim={handleClaim} />
      </div>
    );
  }

  const heroTotal = stats?.totalSpent ?? expenses.reduce((acc, e) => acc + e.amount, 0);
  const pendingSettlementsCount = settlements.filter((s) => s.status === 'Pending').length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 lg:pt-4 pb-28 lg:pb-12 w-full space-y-6 animate-fade-up">
      <GroupHeader
        group={group}
        isAdmin={isAdmin}
        canWrite={canWrite}
        heroTotal={heroTotal}
        expensesCount={expenses.length}
        onOpenNewExpense={modals.openNewExpense}
        onOpenSettings={modals.openSettings}
        onRotateInvite={handleRotateInvite}
      />

      {/* Tabs Navigation */}
      <div className="flex items-center p-1 rounded-md bg-zinc-900 border border-zinc-800 overflow-x-auto gap-1">
        {(['expenses', 'balances', 'settlements', 'stats', 'members'] as TabType[]).map((tab) => {
          const counts: Partial<Record<TabType, number>> = {
            expenses: expenses.length,
            settlements: settlements.length,
            members: group.members.length,
          };
          const count = counts[tab];
          const suffix = count === undefined ? '' : ` (${count})`;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`h-9 sm:h-8 px-3 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-colors cursor-pointer flex-1 sm:flex-initial text-center ${
                activeTab === tab
                  ? 'bg-zinc-800 text-zinc-100 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              {TAB_LABELS[tab]}{suffix}
            </button>
          );
        })}
      </div>

      {activeTab === 'expenses' && (
        <ExpensesTab
          groupId={group.id}
          members={group.members}
          currentMemberId={me}
          isAdmin={isAdmin}
          canWrite={canWrite}
          filterFrom={filters.filterFrom}
          filterTo={filters.filterTo}
          filterCategory={filters.filterCategory}
          filterMemberId={filters.filterMemberId}
          onFilterFromChange={filters.handleFilterFromChange}
          onFilterToChange={filters.handleFilterToChange}
          onFilterCategoryChange={filters.setFilterCategory}
          onFilterMemberIdChange={filters.setFilterMemberId}
          onClearFilters={filters.clearFilters}
          onEditExpense={modals.openEditExpense}
          onDeleteExpense={modals.openDeleteExpense}
          onContestExpense={modals.openContestExpense}
        />
      )}

      {activeTab === 'balances' && (
        <BalancesTab
          groupId={group.id}
          groupName={group.name}
          currentMemberId={me}
          isAdmin={isAdmin}
          pendingSettlementsCount={pendingSettlementsCount}
          onOpenSettlement={(fromId, toId, amount) =>
            modals.openSettlement({ fromId, toId, amount })
          }
        />
      )}

      {activeTab === 'settlements' && (
        <SettlementsTab
          groupId={group.id}
          currentMemberId={me}
          isAdmin={isAdmin}
          canWrite={canWrite}
          onOpenSettlement={() => modals.openSettlement(null)}
          onDeleteSettlement={modals.openDeleteSettlement}
        />
      )}

      {activeTab === 'stats' && (
        <StatsTab
          groupId={group.id}
          memberCount={group.members.length}
          filterFrom={filters.filterFrom}
          filterTo={filters.filterTo}
        />
      )}

      {activeTab === 'members' && (
        <MembersTab
          group={group}
          currentMemberId={me}
          isAdmin={isAdmin}
          canWrite={canWrite}
          onOpenMemberModal={modals.openMemberModal}
          onDeleteMember={modals.openDeleteMember}
        />
      )}

      <GroupModals
        group={group}
        currentMemberId={me}
        isAdmin={isAdmin}
        modals={modals}
      />
    </div>
  );
}

export default function GroupDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex flex-col items-center justify-center animate-fade-in">
          <RefreshCw className="w-8 h-8 text-accent animate-spin mb-3" />
          <p className="text-zinc-400 text-sm">Carregando grupo de despesas...</p>
        </div>
      }
    >
      <GroupDetailContent />
    </Suspense>
  );
}
