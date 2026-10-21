'use client';

import React, { useState } from 'react';
import { type GroupDto, type MemberDto } from '@/lib/api';
import { PIX_KEY_TYPE_LABELS } from '@/lib/formatters';
import { getGroupCredentials } from '@/lib/storage';
import { toast } from '@/components/ui/Toast';
import { DevicesPanel } from '@/components/despesas/DevicesPanel';
import {
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useResetMemberClaim } from '@/lib/query';
import { errorMessageOr } from './groupConstants';

interface MembersTabProps {
  group: GroupDto;
  currentMemberId: string | null;
  isAdmin: boolean;
  canWrite: boolean;
  onOpenMemberModal: (member?: MemberDto) => void;
  onDeleteMember: (member: MemberDto) => void;
}

export function MembersTab({
  group,
  currentMemberId,
  isAdmin,
  canWrite,
  onOpenMemberModal,
  onDeleteMember,
}: Readonly<MembersTabProps>) {
  const [resettingMemberId, setResettingMemberId] = useState<string | null>(null);
  const resetMemberClaimMutation = useResetMemberClaim();

  const handleResetMemberClaim = async (memberId: string) => {
    try {
      await resetMemberClaimMutation.mutateAsync({
        groupId: group.id,
        memberId,
      });
      setResettingMemberId(null);
      toast.success('Acesso do membro liberado!');
    } catch (err: unknown) {
      toast.error(errorMessageOr(err, 'Erro ao liberar acesso.'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-3">
        <h2 className="text-base sm:text-lg font-semibold text-zinc-50 tracking-tight">
          Membros do Grupo ({group.members.length})
        </h2>
        {canWrite && (
          <button
            type="button"
            onClick={() => onOpenMemberModal()}
            className="h-10 sm:h-9 px-3.5 rounded-md bg-accent hover:bg-accent-hover text-accent-fg text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" /> Adicionar Membro
          </button>
        )}
      </div>

      {currentMemberId && (
        <DevicesPanel
          groupId={group.id}
          inviteToken={group.accessToken ?? getGroupCredentials(group.id)?.accessToken}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {group.members.map((m) => {
          const canEditMember = isAdmin || (!!currentMemberId && m.id === currentMemberId);

          return (
            <div
              key={m.id}
              className="p-3.5 sm:p-4 rounded-lg bg-zinc-900 border border-zinc-800 flex flex-col justify-between space-y-3 hover:border-zinc-700 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-accent/15 text-accent border border-accent/30 font-semibold flex items-center justify-center text-xs shrink-0">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-semibold text-zinc-50 text-sm sm:text-base truncate">
                        {m.name}
                      </h3>
                      {m.id === currentMemberId && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-accent/15 text-accent border border-accent/25">
                          Você
                        </span>
                      )}
                      {m.isAdmin && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                          Admin
                        </span>
                      )}
                    </div>
                    {m.pixKey ? (
                      <p className="text-xs text-zinc-400 font-mono break-all mt-0.5">
                        Pix: {m.pixKey} ({m.pixKeyType ? PIX_KEY_TYPE_LABELS[m.pixKeyType] : ''})
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-400 italic mt-0.5">Sem Pix cadastrado</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2.5 border-t border-zinc-800">
                {resettingMemberId === m.id ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-zinc-400">Liberar acesso deste membro?</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={resetMemberClaimMutation.isPending}
                        onClick={() => handleResetMemberClaim(m.id)}
                        className="h-7 px-2.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium text-xs transition cursor-pointer disabled:opacity-50"
                      >
                        {resetMemberClaimMutation.isPending ? 'Liberando...' : 'Confirmar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setResettingMemberId(null)}
                        className="h-7 px-2.5 rounded-md text-zinc-400 hover:text-zinc-200 text-xs transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-1.5 flex-wrap">
                    {isAdmin && m.claimed && m.id !== currentMemberId && (
                      <button
                        type="button"
                        onClick={() => setResettingMemberId(m.id)}
                        className="h-8 px-2.5 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-50 transition text-xs font-medium flex items-center gap-1 cursor-pointer"
                        title="Permite que outra pessoa ou aparelho reivindique este membro"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Liberar acesso
                      </button>
                    )}
                    {canEditMember && (
                      <button
                        type="button"
                        onClick={() => onOpenMemberModal(m)}
                        className="h-8 px-2.5 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-zinc-50 transition text-xs font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Editar
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => onDeleteMember(m)}
                        className="h-8 px-2.5 rounded-md border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 transition text-xs font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remover
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
