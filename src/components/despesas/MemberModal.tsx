'use client';

import React, { useState, useEffect } from 'react';
import { type MemberDto, type PixKeyType, type MemberRequest, ApiError } from '@/lib/api';
import { maskPixKey, normalizePixKey, PIX_KEY_PLACEHOLDERS } from '@/lib/formatters';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { AlertCircle } from 'lucide-react';
import { useAddMember, useUpdateMember } from '@/lib/query';
import { PIX_KEY_TYPE_OPTIONS } from './groupConstants';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  memberToEdit: MemberDto | null;
}

export function MemberModal({
  isOpen,
  onClose,
  groupId,
  memberToEdit,
}: Readonly<MemberModalProps>) {
  const [memberName, setMemberName] = useState('');
  const [memberPixKey, setMemberPixKey] = useState('');
  const [memberPixKeyType, setMemberPixKeyType] = useState<PixKeyType>('Email');
  const [memberError, setMemberError] = useState<string | null>(null);

  const addMemberMutation = useAddMember();
  const updateMemberMutation = useUpdateMember();
  const savingMember = addMemberMutation.isPending || updateMemberMutation.isPending;

  useEffect(() => {
    if (!isOpen) return;

    if (memberToEdit) {
      setMemberName(memberToEdit.name);
      const type = memberToEdit.pixKeyType || 'Email';
      setMemberPixKey(maskPixKey(memberToEdit.pixKey || '', type));
      setMemberPixKeyType(type);
    } else {
      setMemberName('');
      setMemberPixKey('');
      setMemberPixKeyType('Email');
    }
    setMemberError(null);
  }, [isOpen, memberToEdit]);

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberError(null);

    if (!memberName.trim()) {
      setMemberError('O nome do membro é obrigatório.');
      return;
    }

    try {
      const payload: MemberRequest = {
        name: memberName.trim(),
        pixKey: memberPixKey.trim()
          ? normalizePixKey(memberPixKey, memberPixKeyType)
          : null,
        pixKeyType: memberPixKey.trim() ? memberPixKeyType : null,
      };

      if (memberToEdit) {
        await updateMemberMutation.mutateAsync({
          groupId,
          memberId: memberToEdit.id,
          data: payload,
        });
      } else {
        await addMemberMutation.mutateAsync({
          groupId,
          data: payload,
        });
      }

      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) setMemberError(err.message);
      else setMemberError('Erro ao salvar membro.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={memberToEdit ? 'Editar Membro' : 'Novo Membro'}
      maxWidth="md"
    >
      <form onSubmit={handleSaveMember} className="space-y-3.5" noValidate>
        {memberError && (
          <div
            role="alert"
            className="p-3 rounded-md border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{memberError}</span>
          </div>
        )}

        <div>
          <label htmlFor="member-name" className="block text-[13px] font-medium text-zinc-400 mb-1">
            Nome do Membro *
          </label>
          <input
            id="member-name"
            type="text"
            required
            placeholder="Ex: João, Maria, Pedro"
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            className="w-full h-10 sm:h-9 px-3 rounded-md border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm placeholder:text-zinc-400 focus:border-accent focus:outline-none transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <span className="block text-[13px] font-medium text-zinc-400 mb-1">
              Tipo Pix
            </span>
            <Select
              value={memberPixKeyType}
              onChange={(value) => {
                const nextType = value as PixKeyType;
                setMemberPixKeyType(nextType);
                setMemberPixKey((current) => maskPixKey(current, nextType));
              }}
              options={PIX_KEY_TYPE_OPTIONS}
              triggerClassName="px-2.5 py-1.5 h-10 sm:h-9 rounded-md text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="member-pix-key" className="block text-[13px] font-medium text-zinc-400 mb-1">
              Chave Pix (opcional)
            </label>
            <input
              id="member-pix-key"
              type="text"
              inputMode={memberPixKeyType === 'Email' || memberPixKeyType === 'Random' ? 'text' : 'numeric'}
              placeholder={PIX_KEY_PLACEHOLDERS[memberPixKeyType]}
              value={memberPixKey}
              onChange={(e) => setMemberPixKey(maskPixKey(e.target.value, memberPixKeyType))}
              className="w-full h-10 sm:h-9 px-3 rounded-md border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm font-mono placeholder:text-zinc-400 focus:border-accent focus:outline-none transition-colors"
            />
          </div>
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
            disabled={savingMember}
            className="h-10 sm:h-9 px-4 rounded-md bg-accent hover:bg-accent-hover text-accent-fg font-medium text-sm transition-colors shadow-sm cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {savingMember ? 'Salvando...' : 'Salvar Membro'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
