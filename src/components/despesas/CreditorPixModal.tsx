'use client';

import React, { useState } from 'react';
import { type MemberPixDto, type SuggestedTransferDto, ApiError } from '@/lib/api';
import { PixQrModal } from '@/components/splits/PixQrModal';
import { toast } from '@/components/ui/Toast';
import { useCreateSettlement } from '@/lib/query';
import { isoDay } from './groupConstants';

interface CreditorPixModalProps {
  pixData: MemberPixDto | null;
  transfer: SuggestedTransferDto | null;
  onClose: () => void;
  groupId: string;
  groupName: string;
}

export function CreditorPixModal({
  pixData,
  transfer,
  onClose,
  groupId,
  groupName,
}: Readonly<CreditorPixModalProps>) {
  const [isPaid, setIsPaid] = useState(false);
  const createSettlementMutation = useCreateSettlement();

  if (!pixData) return null;

  const handleMarkCreditorPixPaid = async () => {
    if (!transfer) return;
    try {
      await createSettlementMutation.mutateAsync({
        groupId,
        data: {
          fromMemberId: transfer.fromMemberId,
          toMemberId: transfer.toMemberId,
          amount: transfer.amount,
          date: isoDay(new Date()),
          notes: null,
        },
      });
      setIsPaid(true);
      toast.success('Pagamento registrado (aguardando confirmação do recebedor)');
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Erro ao registrar pagamento.';
      toast.error(msg);
    }
  };

  return (
    <PixQrModal
      isOpen={!!pixData}
      onClose={() => {
        setIsPaid(false);
        onClose();
      }}
      title={`Pagar ${pixData.name} via Pix`}
      receiverName={pixData.name}
      amount={pixData.amount}
      pixCode={pixData.pixCode}
      pixKey={pixData.pixKey}
      onMarkPaid={handleMarkCreditorPixPaid}
      isMarkingPaid={createSettlementMutation.isPending}
      isPaid={isPaid}
      payerName={transfer?.fromName}
      splitTitle={groupName}
    />
  );
}
