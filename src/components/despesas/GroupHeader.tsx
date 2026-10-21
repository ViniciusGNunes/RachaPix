'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { type GroupDto } from '@/lib/api';
import { Money } from '@/components/ui/Money';
import { getGroupCredentials } from '@/lib/storage';
import { InvitePanel } from '@/components/despesas/InvitePanel';
import {
  ArrowLeft,
  UserPlus,
  Settings,
  Plus,
} from 'lucide-react';

interface GroupHeaderProps {
  group: GroupDto;
  isAdmin: boolean;
  canWrite: boolean;
  heroTotal: number;
  expensesCount: number;
  onOpenNewExpense: () => void;
  onOpenSettings: () => void;
  onRotateInvite: () => Promise<void>;
}

export function GroupHeader({
  group,
  isAdmin,
  canWrite,
  heroTotal,
  expensesCount,
  onOpenNewExpense,
  onOpenSettings,
  onRotateInvite,
}: Readonly<GroupHeaderProps>) {
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/despesas"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-50 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Grupos
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-2xl font-semibold tracking-tight text-zinc-50">
              {group.name}
            </h1>
            {group.description && (
              <p className="text-sm text-zinc-400 mt-1 max-w-xl leading-relaxed">{group.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsInviteOpen((prev) => !prev)}
              aria-expanded={isInviteOpen}
              className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 text-sm font-semibold transition active:scale-[0.98] cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-accent" />
              <span>Convidar</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={onOpenSettings}
                aria-label="Configurações do grupo"
                className="inline-flex items-center justify-center w-11 h-11 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-50 active:scale-[0.98] transition cursor-pointer"
                title="Configurações do grupo"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            {canWrite && (
              <button
                type="button"
                onClick={onOpenNewExpense}
                className="fixed right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 sm:static inline-flex items-center justify-center gap-2 h-11 sm:h-12 px-4 sm:px-5 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg font-semibold text-sm sm:text-[15px] active:scale-[0.98] transition-all cursor-pointer shadow-lg sm:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Nova Despesa</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {isInviteOpen && (
        <InvitePanel
          groupId={group.id}
          inviteToken={group.accessToken ?? getGroupCredentials(group.id)?.accessToken}
          adminToken={group.adminToken}
          isAdmin={isAdmin}
          onRotate={isAdmin ? onRotateInvite : undefined}
          variant="card"
        />
      )}

      <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
        <div>
          <span className="text-[13px] font-medium text-zinc-400">Total acumulado</span>
          <div className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-50 mt-0.5 tabular-nums">
            <Money value={heroTotal} animate />
          </div>
        </div>
        <div className="text-xs sm:text-sm text-zinc-400">
          <span className="font-semibold text-zinc-200">{expensesCount}</span> {expensesCount === 1 ? 'despesa' : 'despesas'} · <span className="font-semibold text-zinc-200">{group.members.length}</span> {group.members.length === 1 ? 'membro' : 'membros'}
        </div>
      </div>
    </div>
  );
}
