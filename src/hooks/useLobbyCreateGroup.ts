'use client';

import { useState } from 'react';
import {
  ApiError,
  type CreateGroupRequest,
  type PixKeyType,
} from '@/lib/api';
import { normalizePixKey } from '@/lib/formatters';
import { saveGroup } from '@/lib/storage';
import { toast } from '@/components/ui/Toast';
import { useCreateGroup } from '@/lib/query';

export interface InitialMemberField {
  id: string;
  name: string;
  pixKey: string;
  pixKeyType: PixKeyType;
}

export interface CreatedGroupInfo {
  id: string;
  name: string;
  inviteToken: string;
  adminToken: string;
}

export function useLobbyCreateGroup(onSuccessCreated?: () => void) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createdGroup, setCreatedGroup] = useState<CreatedGroupInfo | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [members, setMembers] = useState<InitialMemberField[]>([
    { id: '1', name: '', pixKey: '', pixKeyType: 'Email' },
    { id: '2', name: '', pixKey: '', pixKeyType: 'Email' },
  ]);
  const [modalError, setModalError] = useState<string | null>(null);

  const createGroupMutation = useCreateGroup();

  const handleAddMember = () => {
    setMembers((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: '',
        pixKey: '',
        pixKeyType: 'Email',
      },
    ]);
  };

  const handleRemoveMember = (id: string) => {
    if (members.length <= 1) return;
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleUpdateMember = (id: string, updates: Partial<InitialMemberField>) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!name.trim()) {
      setModalError('O nome do grupo é obrigatório.');
      return;
    }

    // Filter non-empty member names
    const validMembers = members
      .map((m) => ({
        name: m.name.trim(),
        pixKey: m.pixKey.trim() ? normalizePixKey(m.pixKey, m.pixKeyType) : null,
        pixKeyType: m.pixKey.trim() ? m.pixKeyType : null,
      }))
      .filter((m) => m.name.length > 0);

    // Check duplicate names
    const namesSet = new Set<string>();
    for (const m of validMembers) {
      const lower = m.name.toLowerCase();
      if (namesSet.has(lower)) {
        setModalError(`Nome duplicado de membro: "${m.name}".`);
        return;
      }
      namesSet.add(lower);
    }

    try {
      const payload: CreateGroupRequest = {
        name: name.trim(),
        description: description.trim() || null,
        members: validMembers.length > 0 ? validMembers : undefined,
      };

      const newGroup = await createGroupMutation.mutateAsync(payload);
      saveGroup({
        id: newGroup.id,
        name: newGroup.name,
        accessToken: newGroup.accessToken ?? undefined,
        adminToken: newGroup.adminToken ?? undefined,
      });

      setIsModalOpen(false);
      setName('');
      setDescription('');
      setMembers([
        { id: '1', name: '', pixKey: '', pixKeyType: 'Email' },
        { id: '2', name: '', pixKey: '', pixKeyType: 'Email' },
      ]);

      setCreatedGroup({
        id: newGroup.id,
        name: newGroup.name,
        inviteToken: newGroup.accessToken ?? '',
        adminToken: newGroup.adminToken ?? '',
      });

      onSuccessCreated?.();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setModalError(err.message);
        toast.error(err.message);
      } else {
        setModalError('Erro ao criar grupo. Tente novamente.');
        toast.error('Erro ao criar grupo.');
      }
    }
  };

  const closeCreatedGroup = () => {
    setCreatedGroup(null);
  };

  return {
    isModalOpen,
    setIsModalOpen,
    createdGroup,
    closeCreatedGroup,
    name,
    setName,
    description,
    setDescription,
    members,
    modalError,
    isSubmitting: createGroupMutation.isPending,
    handleAddMember,
    handleRemoveMember,
    handleUpdateMember,
    handleCreateGroup,
  };
}
