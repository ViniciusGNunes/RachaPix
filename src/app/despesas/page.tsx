'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  api,
  ApiError,
  CreateGroupRequest,
  MyGroupDto,
  PixKeyType,
} from '@/lib/api';
import { Money } from '@/components/ui/Money';
import {
  maskPixKey,
  normalizePixKey,
  PIX_KEY_PLACEHOLDERS,
  PIX_KEY_TYPE_LABELS,
} from '@/lib/formatters';
import { Select } from '@/components/ui/Select';
import { getSavedGroups, removeSavedGroup, saveGroup } from '@/lib/storage';
import { groupPath } from '@/lib/routes';
import { Modal } from '@/components/ui/Modal';
import { InvitePanel } from '@/components/despesas/InvitePanel';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import {
  Plus,
  AlertCircle,
  Trash2,
  Users,
} from 'lucide-react';

const PIX_KEY_TYPE_OPTIONS = (Object.keys(PIX_KEY_TYPE_LABELS) as PixKeyType[]).map((type) => ({
  value: type,
  label: PIX_KEY_TYPE_LABELS[type],
}));

interface InitialMemberField {
  id: string;
  name: string;
  pixKey: string;
  pixKeyType: PixKeyType;
}

export default function DespesasPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<MyGroupDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Group Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createdGroup, setCreatedGroup] = useState<{ id: string; name: string; inviteToken: string; adminToken: string } | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [members, setMembers] = useState<InitialMemberField[]>([
    { id: '1', name: '', pixKey: '', pixKeyType: 'Email' },
    { id: '2', name: '', pixKey: '', pixKeyType: 'Email' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const saved = getSavedGroups();
      const items = saved.flatMap((g) => {
        const token = g.memberToken ?? g.adminToken ?? g.accessToken;
        return token ? [{ id: g.id, token }] : [];
      });
      const data = items.length > 0 ? await api.lookupGroups(items) : [];
      const reachable = new Set(data.map((g) => g.id));
      saved.filter((g) => !reachable.has(g.id)).forEach((g) => removeSavedGroup(g.id));
      setGroups(data);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
        toast.error(err.message);
      } else {
        setError('Não foi possível carregar os grupos. Verifique a conexão com o servidor.');
        toast.error('Não foi possível carregar os grupos.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleAddMember = () => {
    setMembers((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
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
      setIsSubmitting(true);
      const payload: CreateGroupRequest = {
        name: name.trim(),
        description: description.trim() || null,
        members: validMembers.length > 0 ? validMembers : undefined,
      };

      const newGroup = await api.createGroup(payload);
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
      // Show the private-group invite first; the person enters the group from there.
      setCreatedGroup({
        id: newGroup.id,
        name: newGroup.name,
        inviteToken: newGroup.accessToken ?? '',
        adminToken: newGroup.adminToken ?? '',
      });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setModalError(err.message);
        toast.error(err.message);
      } else {
        setModalError('Erro ao criar grupo. Tente novamente.');
        toast.error('Erro ao criar grupo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 lg:pt-4 pb-28 lg:pb-12 w-full space-y-6 lg:space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-2xl font-semibold tracking-tight text-zinc-50">
            Grupos
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Gerencie despesas compartilhadas e acertos de contas
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="fixed right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 sm:static inline-flex items-center justify-center gap-2 h-11 sm:h-12 px-4 sm:px-5 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg font-semibold text-sm sm:text-[15px] active:scale-[0.98] transition-all cursor-pointer shadow-lg sm:shadow-sm"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Novo Grupo</span>
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-44 w-full rounded-2xl bg-zinc-900/40 border border-zinc-800/80 p-5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="w-9 h-9 rounded-full" />
                  <Skeleton className="w-20 h-5 rounded-full" />
                </div>
                <Skeleton className="w-3/4 h-5 rounded-lg" />
                <Skeleton className="w-1/2 h-3 rounded-lg" />
              </div>
              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                <Skeleton className="w-16 h-3 rounded-lg" />
                <Skeleton className="w-24 h-5 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-5 sm:p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3.5">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h2 className="font-semibold text-base text-rose-200">Falha na conexão com a API</h2>
            <p className="text-rose-300/90 leading-relaxed">{error}</p>
            <button
              type="button"
              onClick={fetchGroups}
              className="mt-2 h-11 px-4 rounded-xl border border-rose-500/40 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold text-sm transition-colors active:scale-[0.98] cursor-pointer inline-flex items-center justify-center"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      ) : groups.length === 0 ? (
        /* Empty State */
        <div className="p-8 sm:p-12 text-center flex flex-col items-center max-w-md mx-auto rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300 mb-4 shadow-sm">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-zinc-50 tracking-tight">
            Nenhum grupo cadastrado ainda
          </h2>
          <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
            Crie um grupo para começar a adicionar membros, lançar despesas e acompanhar quem deve quanto para quem.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-6 inline-flex items-center gap-2 h-11 sm:h-12 px-5 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg font-semibold text-sm sm:text-[15px] active:scale-[0.98] transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Criar meu primeiro grupo
          </button>
        </div>
      ) : (
        /* Groups grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={groupPath(group.id)}
              className="group p-5 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700/80 transition-all flex flex-col justify-between gap-4 active:scale-[0.99] cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-9 h-9 rounded-full bg-accent/15 text-accent border border-accent/30 font-semibold flex items-center justify-center text-sm shrink-0">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-800/80 border border-zinc-700/60 text-zinc-400">
                    {group.memberCount} {group.memberCount === 1 ? 'membro' : 'membros'}
                  </span>
                </div>
                <h2 className="text-base font-semibold text-zinc-50 group-hover:text-accent transition-colors truncate">
                  {group.name}
                </h2>
                {group.description && (
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                    {group.description}
                  </p>
                )}
              </div>
              <div className="pt-3 border-t border-zinc-800/80 flex items-baseline justify-between">
                <span className="text-xs text-zinc-400">Total gasto</span>
                <span className="text-base sm:text-lg font-bold text-zinc-50 tabular-nums">
                  <Money value={group.totalSpent} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal: Criar Grupo */}
      <Modal
        isOpen={createdGroup !== null}
        onClose={() => {
          if (createdGroup) router.push(groupPath(createdGroup.id));
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Criar Novo Grupo"
        description="Defina o nome do grupo e adicione os membros iniciais."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateGroup} className="space-y-4">
          {modalError && (
            <div
              role="alert"
              className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{modalError}</span>
            </div>
          )}

          {/* Step-like Card 1: Dados do grupo */}
          <section className="p-4 sm:p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
            <h3 className="flex items-center gap-2.5 text-sm font-semibold text-zinc-50">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 border border-accent/30 text-xs font-semibold text-accent">
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
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-50 text-base md:text-sm placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors"
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
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-50 text-base md:text-sm placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors"
              />
            </div>
          </section>

          {/* Step-like Card 2: Membros Iniciais */}
          <section className="p-4 sm:p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2.5 text-sm font-semibold text-zinc-50">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 border border-accent/30 text-xs font-semibold text-accent">
                  2
                </span>{' '}
                Membros iniciais
              </h3>
              <button
                type="button"
                onClick={handleAddMember}
                className="inline-flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 hover:border-zinc-700 text-xs font-medium text-zinc-200 transition-all active:scale-[0.98] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-accent" />
                Adicionar Membro
              </button>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {members.map((m, index) => {
                const initial = m.name.trim() ? m.name.trim().charAt(0).toUpperCase() : String(index + 1);
                return (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col gap-2.5 animate-fade-in"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs shrink-0 select-none bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                        {initial}
                      </div>
                      <input
                        type="text"
                        placeholder={`Nome ${index + 1}`}
                        value={m.name}
                        onChange={(e) => handleUpdateMember(m.id, { name: e.target.value })}
                        className="flex-1 min-w-0 h-10 px-3 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-50 text-base md:text-sm placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(m.id)}
                        disabled={members.length <= 1}
                        aria-label="Remover membro"
                        title="Remover membro"
                        className="p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-zinc-500 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 pl-9.5">
                      <Select
                        ariaLabel="Tipo da chave Pix"
                        className="w-32 shrink-0"
                        triggerClassName="px-2.5 py-1.5 h-10 text-xs rounded-xl"
                        value={m.pixKeyType}
                        onChange={(value) => {
                          const nextType = value as PixKeyType;
                          handleUpdateMember(m.id, {
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
                          handleUpdateMember(m.id, { pixKey: maskPixKey(e.target.value, m.pixKeyType) })
                        }
                        className="flex-1 min-w-0 h-10 px-3 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-50 text-base md:text-xs font-mono placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="h-11 px-4 rounded-xl border border-zinc-800 text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800/60 font-semibold text-sm transition-colors active:scale-[0.98] cursor-pointer inline-flex items-center justify-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-11 px-5 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg font-semibold text-sm transition-all active:scale-[0.98] shadow-sm cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Criando...' : 'Criar Grupo'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
