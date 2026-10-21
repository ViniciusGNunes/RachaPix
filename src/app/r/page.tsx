'use client';

import React from 'react';
import { useSplitPublicPage } from '@/hooks/useSplitPublicPage';
import { SplitPublicSkeleton } from '@/components/splits/SplitPublicSkeleton';
import { SplitPublicNotFound } from '@/components/splits/SplitPublicNotFound';
import { SplitPublicHeader } from '@/components/splits/SplitPublicHeader';
import { SplitPublicParticipants } from '@/components/splits/SplitPublicParticipants';
import { PixQrModal } from '@/components/splits/PixQrModal';

function PublicSplitContent() {
  const {
    split,
    loading,
    error,
    savedToken,
    selectedParticipant,
    pixData,
    loadingPix,
    markingPaid,
    ownerNotice,
    actionError,
    progressPct,
    isOverdue,
    termsAccepted,
    handleSelectParticipant,
    handleMarkPaid,
    handleClosePixModal,
    clearActionError,
  } = useSplitPublicPage();

  if (loading && !split) {
    return <SplitPublicSkeleton />;
  }

  if (error || !split) {
    return <SplitPublicNotFound error={error} />;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-10 w-full space-y-5 animate-fade-up">
      <SplitPublicHeader
        split={split}
        progressPct={progressPct}
        savedToken={savedToken}
      />

      {actionError && (
        <div
          role="alert"
          className="p-3 rounded-md border border-rose-800 bg-rose-950/30 text-rose-300 text-sm flex items-center justify-between gap-3 animate-fade-in"
        >
          <span>{actionError}</span>
          <button
            type="button"
            onClick={clearActionError}
            className="text-sm font-medium hover:underline cursor-pointer min-h-9 px-2"
          >
            Fechar
          </button>
        </div>
      )}

      {ownerNotice && (
        <div className="p-3 rounded-md border border-zinc-800 bg-zinc-900 text-sm text-zinc-300 flex items-center gap-2.5 animate-fade-in">
          <p>{ownerNotice}</p>
        </div>
      )}

      <SplitPublicParticipants
        split={split}
        isOverdue={isOverdue}
        loadingPix={loadingPix}
        termsAccepted={termsAccepted}
        onSelectParticipant={handleSelectParticipant}
      />

      {selectedParticipant && pixData && (
        <PixQrModal
          isOpen={Boolean(selectedParticipant && !selectedParticipant.isOwner)}
          onClose={handleClosePixModal}
          receiverName={pixData.receiverName}
          amount={pixData.amount}
          pixCode={pixData.pixCode}
          pixKey={pixData.pixKey}
          isPaid={selectedParticipant.paid}
          isPending={selectedParticipant.paymentPending}
          onMarkPaid={handleMarkPaid}
          isMarkingPaid={markingPaid}
          splitTitle={split.title}
          payerName={selectedParticipant.name}
          participantId={selectedParticipant.id}
        />
      )}
    </div>
  );
}

export default function PublicSplitPage() {
  return (
    <React.Suspense fallback={<SplitPublicSkeleton />}>
      <PublicSplitContent />
    </React.Suspense>
  );
}
