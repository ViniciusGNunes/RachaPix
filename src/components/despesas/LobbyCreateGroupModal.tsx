import React from 'react';
import type { PixKeyType } from '@/lib/api';
import {
  maskPixKey,
  PIX_KEY_PLACEHOLDERS,
  PIX_KEY_TYPE_LABELS,
} from '@/lib/formatters';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import type { InitialMemberField } from '@/hooks/useLobbyCreateGroup';

const PIX_KEY_TYPE_OPTIONS = (Object.keys(PIX_KEY_TYPE_LABELS) as PixKeyType[]).map((type) => ({
  value: type,
  label: PIX_KEY_TYPE_LABELS[type],
}));

interface LobbyCreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  setName: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  members: InitialMemberField[];
  modalError: string | null;
  isSubmitting: boolean;
  onAddMember: () => void;
  onRemoveMember: (id: string) => void;
  onUpdateMember: (id: string, updates: Partial<InitialMemberField>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function LobbyCreateGroupModal({
  isOpen,
  onClose,
  name,
  setName,
  description,
  setDescription,
  members,
  modalError,
  isSubmitting,
  onAddMember,
  onRemoveMember,
  onUpdateMember,
  onSubmit,
}: Readonly<LobbyCreateGroupModalProps>) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Criar Novo Grupo"
      description="Defina o nome do grupo e adicione os membros iniciais."
      maxWidth="lg"
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {modalError && (
          <div
            role="alert"
            className="p-3 rounded-md border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{modalError}</span>
          </div>
        )}

        {/* Section 1: Dados do grupo */}
        <section className="space-y-3 pb-4 border-b border-zinc-800">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-50">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 border border-accent/30 text-xs font-semibold text-accent">
              1
            </span>{' '}
            Dados do grupo
          </h3>

          <div>
            <label htmlFor="group-name" className="block text-[13px] font-medium text-zinc-400 mb-1.5">
              Nome do Grupo *
            </label>
            <input
              id="group-name"
              type="text"
              required
              placeholder="Ex: Viagem Florianópolis, Apê 42, Churrasco"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 sm:h-9 px-3 rounded-md border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm placeholder:text-zinc-400 focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="group-description" className="block text-[13px] font-medium text-zinc-400 mb-1.5">
              Descrição (opcional)
            </label>
            <input
              id="group-description"
              type="text"
              placeholder="Ex: Despesas gerais e compras coletivas"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-10 sm:h-9 px-3 rounded-md border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm placeholder:text-zinc-400 focus:border-accent focus:outline-none transition-colors"
            />
          </div>
        </section>

        {/* Section 2: Membros Iniciais */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-50">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 border border-accent/30 text-xs font-semibold text-accent">
                2
              </span>{' '}
              Membros iniciais
            </h3>
            <button
              type="button"
              onClick={onAddMember}
              className="inline-flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-700 text-xs font-medium text-zinc-200 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-accent" />
              Adicionar Membro
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {members.map((m, index) => {
              const initial = m.name.trim() ? m.name.trim().charAt(0).toUpperCase() : String(index + 1);
              return (
                <div
                  key={m.id}
                  className="p-2.5 rounded-md bg-zinc-900 border border-zinc-800 flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center font-semibold text-xs shrink-0 select-none bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {initial}
                    </div>
                    <input
                      type="text"
                      placeholder={`Nome ${index + 1}`}
                      value={m.name}
                      onChange={(e) => onUpdateMember(m.id, { name: e.target.value })}
                      className="flex-1 min-w-0 h-10 sm:h-9 px-3 rounded-md border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm placeholder:text-zinc-400 focus:border-accent focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => onRemoveMember(m.id)}
                      disabled={members.length <= 1}
                      aria-label="Remover membro"
                      title="Remover membro"
                      className="p-1.5 rounded-md text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-zinc-400 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 pl-8">
                    <Select
                      ariaLabel="Tipo da chave Pix"
                      className="w-32 shrink-0"
                      triggerClassName="px-2.5 py-1.5 h-10 sm:h-9 text-xs rounded-md"
                      value={m.pixKeyType}
                      onChange={(value) => {
                        const nextType = value as PixKeyType;
                        onUpdateMember(m.id, {
                          pixKeyType: nextType,
                          pixKey: maskPixKey(m.pixKey, nextType),
                        });
                      }}
                      options={PIX_KEY_TYPE_OPTIONS}
                    />
                    <input
                      type="text"
                      inputMode={m.pixKeyType === 'Email' || m.pixKeyType === 'Random' ? 'text' : 'numeric'}
                      placeholder={PIX_KEY_PLACEHOLDERS[m.pixKeyType]}
                      value={m.pixKey}
                      onChange={(e) =>
                        onUpdateMember(m.id, { pixKey: maskPixKey(e.target.value, m.pixKeyType) })
                      }
                      className="flex-1 min-w-0 h-10 sm:h-9 px-3 rounded-md border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm font-mono placeholder:text-zinc-400 focus:border-accent focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="h-10 sm:h-9 px-3.5 rounded-md border border-zinc-800 text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800 font-medium text-sm transition-colors cursor-pointer inline-flex items-center justify-center"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-10 sm:h-9 px-4 rounded-md bg-accent hover:bg-accent-hover text-accent-fg font-medium text-sm transition-colors shadow-sm cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Criando...' : 'Criar Grupo'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
