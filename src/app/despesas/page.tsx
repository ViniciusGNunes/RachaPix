'use client';

import React from 'react';
import { useLobbyGroups } from '@/hooks/useLobbyGroups';
import { useLobbyCreateGroup } from '@/hooks/useLobbyCreateGroup';
import { LobbyHeader } from '@/components/despesas/LobbyHeader';
import { LobbySkeleton } from '@/components/despesas/LobbySkeleton';
import { LobbyErrorAlert } from '@/components/despesas/LobbyErrorAlert';
import { LobbyEmptyState } from '@/components/despesas/LobbyEmptyState';
import { LobbyGroupGrid } from '@/components/despesas/LobbyGroupGrid';
import { LobbyCreatedModal } from '@/components/despesas/LobbyCreatedModal';
import { LobbyCreateGroupModal } from '@/components/despesas/LobbyCreateGroupModal';

export default function DespesasPage() {
  const { groups, loading, error, refetch, reloadSaved } = useLobbyGroups();

  const {
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
    isSubmitting,
    handleAddMember,
    handleRemoveMember,
    handleUpdateMember,
    handleCreateGroup,
  } = useLobbyCreateGroup(reloadSaved);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 lg:pt-4 pb-28 lg:pb-12 w-full space-y-6 lg:space-y-6 animate-fade-up">
      <LobbyHeader onOpenCreateModal={() => setIsModalOpen(true)} />

      {loading ? (
        <LobbySkeleton />
      ) : error ? (
        <LobbyErrorAlert error={error} onRetry={() => void refetch()} />
      ) : groups.length === 0 ? (
        <LobbyEmptyState onOpenCreateModal={() => setIsModalOpen(true)} />
      ) : (
        <LobbyGroupGrid groups={groups} />
      )}

      <LobbyCreatedModal
        createdGroup={createdGroup}
        onClose={closeCreatedGroup}
      />

      <LobbyCreateGroupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        name={name}
        setName={setName}
        description={description}
        setDescription={setDescription}
        members={members}
        modalError={modalError}
        isSubmitting={isSubmitting}
        onAddMember={handleAddMember}
        onRemoveMember={handleRemoveMember}
        onUpdateMember={handleUpdateMember}
        onSubmit={handleCreateGroup}
      />
    </div>
  );
}
