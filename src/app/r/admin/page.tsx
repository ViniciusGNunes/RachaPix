'use client';

import React from 'react';
import { useSplitAdminPage } from '@/hooks/useSplitAdminPage';
import { SplitAdminSkeleton } from '@/components/splits/SplitAdminSkeleton';
import { SplitAdminTokenPrompt } from '@/components/splits/SplitAdminTokenPrompt';
import { SplitAdminAuthError } from '@/components/splits/SplitAdminAuthError';
import { SplitAdminHeader } from '@/components/splits/SplitAdminHeader';
import { SplitAdminParticipants } from '@/components/splits/SplitAdminParticipants';
import { SplitDeleteModal } from '@/components/splits/SplitDeleteModal';

function SplitAdminContent() {
  const {
    slug,
    token,
    inputToken,
    setInputToken,
    split,
    loading,
    refreshing,
    error,
    togglingId,
    deleteModalOpen,
    setDeleteModalOpen,
    isDeleting,
    actionError,
    setActionError,
    progressPct,
    isOverdue,
    publicUrl,
    handleApplyToken,
    handleResetToken,
    handleRejectClaim,
    handleTogglePaid,
    handleDeleteSplit,
  } = useSplitAdminPage();

  if (!token && !loading) {
    return (
      <SplitAdminTokenPrompt
        slug={slug}
        inputToken={inputToken}
        setInputToken={setInputToken}
        onSubmit={handleApplyToken}
      />
    );
  }

  if (loading && !split) {
    return <SplitAdminSkeleton />;
  }

  if (error || !split) {
    return (
      <SplitAdminAuthError
        error={error}
        onResetToken={handleResetToken}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-12 w-full space-y-6 animate-fade-up">
      {actionError && !deleteModalOpen && (
        <div
          role="alert"
          className="border border-rose-800/80 bg-rose-950/20 text-rose-300 p-4 rounded-xl text-sm flex items-start justify-between gap-3 animate-fade-in"
        >
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-sm font-medium hover:underline cursor-pointer min-h-11 px-2"
          >
            Fechar
          </button>
        </div>
      )}

      <SplitAdminHeader
        split={split}
        slug={slug}
        refreshing={refreshing}
        progressPct={progressPct}
        publicUrl={publicUrl}
        onOpenDeleteModal={() => setDeleteModalOpen(true)}
      />

      <SplitAdminParticipants
        participants={split.participants}
        isOverdue={isOverdue}
        togglingId={togglingId}
        onRejectClaim={handleRejectClaim}
        onTogglePaid={handleTogglePaid}
      />

      <SplitDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setActionError(null);
        }}
        splitTitle={split.title}
        actionError={actionError}
        isDeleting={isDeleting}
        onDelete={handleDeleteSplit}
      />
    </div>
  );
}

export default function SplitAdminPage() {
  return (
    <React.Suspense fallback={<SplitAdminSkeleton />}>
      <SplitAdminContent />
    </React.Suspense>
  );
}
