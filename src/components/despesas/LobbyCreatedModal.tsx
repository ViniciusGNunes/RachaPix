import React from 'react';
import { useRouter } from 'next/navigation';
import { groupPath } from '@/lib/routes';
import { Modal } from '@/components/ui/Modal';
import { InvitePanel } from '@/components/despesas/InvitePanel';
import type { CreatedGroupInfo } from '@/hooks/useLobbyCreateGroup';

interface LobbyCreatedModalProps {
  createdGroup: CreatedGroupInfo | null;
  onClose: () => void;
}

export function LobbyCreatedModal({ createdGroup, onClose }: LobbyCreatedModalProps) {
  const router = useRouter();

  return (
    <Modal
      isOpen={createdGroup !== null}
      onClose={() => {
        if (createdGroup) {
          router.push(groupPath(createdGroup.id));
        }
        onClose();
      }}
      title={createdGroup?.name ?? 'Grupo criado'}
      maxWidth="2xl"
    >
      {createdGroup && (
        <div className="space-y-5">
          <InvitePanel
            variant="hero"
            groupId={createdGroup.id}
            inviteToken={createdGroup.inviteToken}
            adminToken={createdGroup.adminToken}
            isAdmin
          />
          <p className="text-sm text-zinc-400 leading-relaxed">
            Você é o admin deste grupo. Ao entrar, escolha quem você é na lista de membros.
          </p>
          <button
            type="button"
            onClick={() => router.push(groupPath(createdGroup.id))}
            className="w-full h-12 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg font-semibold text-[15px] active:scale-[0.98] transition cursor-pointer"
          >
            Ir para o grupo
          </button>
        </div>
      )}
    </Modal>
  );
}
