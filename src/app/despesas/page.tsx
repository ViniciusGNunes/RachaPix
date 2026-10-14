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
import {
  formatBRL,
  maskPixKey,
  normalizePixKey,
  PIX_KEY_PLACEHOLDERS,
  PIX_KEY_TYPE_LABELS,
} from '@/lib/formatters';
import { Select } from '@/components/ui/Select';
import { getSavedGroups, removeSavedGroup, saveGroup } from '@/lib/storage';
import { Modal } from '@/components/ui/Modal';
import {
  Users,
  Plus,
  ArrowRight,
  Receipt,
  AlertCircle,
  RefreshCw,
  Trash2,
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
        const token = g.adminToken ?? g.accessToken;
        return token ? [{ id: g.id, token }] : [];
      });
      const data = items.length > 0 ? await api.lookupGroups(items) : [];
      const reachable = new Set(data.map((g) => g.id));
      saved.filter((g) => !reachable.has(g.id)).forEach((g) => removeSavedGroup(g.id));
      setGroups(data);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Não foi possível carregar os grupos. Verifique a conexão com o servidor.');
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
      router.push(`/despesas/${newGroup.id}`);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setModalError(err.message);
      } else {
        setModalError('Erro ao criar grupo. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-zinc-50" />
            Despesas Compartilhadas
          </h1>
          <p className=" text-zinc-400 text-sm mt-1">
            Organize gastos de repúblicas, viagens ou eventos com cálculo automático de saldos e quitação.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-50 hover:bg-zinc-200 text-zinc-950 font-bold text-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          Novo Grupo
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <RefreshCw className="w-8 h-8 text-zinc-50 animate-spin mb-3" />
          <p className="text-zinc-400 text-sm">Carregando grupos de despesas...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-sm flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-base mb-1">Falha na conexão com a API</h3>
            <p className=" text-rose-400">{error}</p>
            <button
              onClick={fetchGroups}
              className="mt-3 px-3.5 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      ) : groups.length === 0 ? (
        /* Empty State */
        <div className="py-16 px-6 text-center bg-zinc-950 rounded-xl border border-zinc-800 flex flex-col items-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-xl bg-zinc-900 text-zinc-50 flex items-center justify-center mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">
            Nenhum grupo cadastrado ainda
          </h2>
          <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
            Crie um grupo para começar a adicionar membros, lançar despesas e acompanhar quem deve quanto para quem.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-200 text-zinc-950 font-semibold text-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Criar meu primeiro grupo
          </button>
        </div>
      ) : (
        /* Groups Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/despesas/${group.id}`}
              className="group bg-zinc-950 rounded-xl p-6 border border-zinc-800 hover:border-zinc-700 hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="w-11 h-11 rounded-xl bg-zinc-900 text-zinc-50 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {group.memberCount} {group.memberCount === 1 ? 'membro' : 'membros'}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-white mt-4 group-hover:text-zinc-50 transition-colors">
                  {group.name}
                </h2>
                {group.description && (
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                    {group.description}
                  </p>
                )}
              </div>

              <div className="pt-6 mt-6 border-t border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block">
                    Total Gasto
                  </span>
                  <span className="text-lg font-semibold text-white">
                    {formatBRL(group.totalSpent)}
                  </span>
                </div>

                <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-50 group-hover:text-zinc-950 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal: Criar Grupo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Criar Novo Grupo"
        description="Defina o nome do grupo e adicione os membros iniciais."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateGroup} className="space-y-5">
          {modalError && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Nome do Grupo *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Viagem Florianópolis, Apê 42, Churrasco"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white text-sm focus:ring-2 focus:ring-zinc-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Descrição (opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Despesas gerais e compras coletivas"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white text-sm focus:ring-2 focus:ring-zinc-600 focus:outline-none"
            />
          </div>

          {/* Initial Members List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300">
                Membros Iniciais
              </label>
              <button
                type="button"
                onClick={handleAddMember}
                className="text-xs font-bold text-zinc-50 hover:text-zinc-200 flex items-center gap-1 cursor-pointer px-2 py-1 -mr-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-600"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Membro
              </button>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-2">
              {members.map((m, index) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col gap-2"
                >
                  <input
                    type="text"
                    placeholder={`Nome ${index + 1}`}
                    value={m.name}
                    onChange={(e) => handleUpdateMember(m.id, { name: e.target.value })}
                    className="w-full min-w-0 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-950 text-sm focus:outline-none"
                  />
                  <div className="flex items-center gap-2 min-w-0">
                    <Select
                      ariaLabel="Tipo da chave Pix"
                      className="w-32 shrink-0"
                      triggerClassName="px-2.5 py-1.5 text-xs rounded-lg"
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
                      className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-950 text-xs font-mono focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m.id)}
                      disabled={members.length <= 1}
                      aria-label="Remover membro"
                      className="p-1.5 shrink-0 text-zinc-500 hover:text-rose-300 disabled:opacity-20 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-zinc-300 hover:bg-zinc-900 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-bold text-zinc-950 bg-zinc-50 hover:bg-zinc-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Criando...' : 'Criar Grupo'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
