'use client';

import React, { useState, useEffect } from 'react';
import { type GroupDto, ApiError } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { AlertCircle } from 'lucide-react';
import { useUpdateGroup } from '@/lib/query';
import { saveGroup } from '@/lib/storage';

interface GroupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: GroupDto;
  onOpenDeleteConfirm: () => void;
}

export function GroupSettingsModal({
  isOpen,
  onClose,
  group,
  onOpenDeleteConfirm,
}: Readonly<GroupSettingsModalProps>) {
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDesc, setEditGroupDesc] = useState('');
  const [groupSettingsError, setGroupSettingsError] = useState<string | null>(null);

  const updateGroupMutation = useUpdateGroup();

  useEffect(() => {
    if (isOpen) {
      setEditGroupName(group.name);
      setEditGroupDesc(group.description || '');
      setGroupSettingsError(null);
    }
  }, [isOpen, group]);

  const handleSaveGroupSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editGroupName.trim()) return;

    setGroupSettingsError(null);
    try {
      const updated = await updateGroupMutation.mutateAsync({
        id: group.id,
        data: {
          name: editGroupName.trim(),
          description: editGroupDesc.trim() || null,
        },
      });

      saveGroup({
        id: updated.id,
        name: updated.name,
        accessToken: updated.accessToken ?? undefined,
        adminToken: updated.adminToken ?? undefined,
      });

      onClose();
    } catch (err: unknown) {
      setGroupSettingsError(err instanceof ApiError ? err.message : 'Erro ao atualizar grupo.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setGroupSettingsError(null);
      }}
      title="Configurações do Grupo"
      maxWidth="md"
    >
      <div className="space-y-5">
        {groupSettingsError && (
          <div
            role="alert"
            className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{groupSettingsError}</span>
          </div>
        )}

        <form onSubmit={handleSaveGroupSettings} className="space-y-4">
          <div>
            <label htmlFor="edit-group-name" className="block text-[13px] font-medium text-zinc-400 mb-1.5">
              Nome do Grupo
            </label>
            <input
              id="edit-group-name"
              type="text"
              required
              value={editGroupName}
              onChange={(e) => setEditGroupName(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-50 text-base md:text-sm placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="edit-group-desc" className="block text-[13px] font-medium text-zinc-400 mb-1.5">
              Descrição
            </label>
            <input
              id="edit-group-desc"
              type="text"
              value={editGroupDesc}
              onChange={(e) => setEditGroupDesc(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-50 text-base md:text-sm placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <div className="flex justify-end gap-2.5">
            <button
              type="submit"
              disabled={updateGroupMutation.isPending}
              className="h-11 px-5 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg font-semibold text-sm transition-all active:scale-[0.98] shadow-sm cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {updateGroupMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>

        <div className="pt-4 border-t border-zinc-800/80 space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-400">
            Zona de Perigo
          </h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Excluir este grupo apagará todas as despesas, acertos e registros para sempre.
          </p>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenDeleteConfirm();
            }}
            className="h-11 px-4 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-sm transition-colors active:scale-[0.98] cursor-pointer inline-flex items-center justify-center"
          >
            Excluir Grupo Definitivamente
          </button>
        </div>
      </div>
    </Modal>
  );
}
