'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  api,
  ApiError,
  GroupDto,
  MemberDto,
  ExpenseDto,
  SettlementDto,
  BalanceDto,
  StatsDto,
  ExpenseCategory,
  PaymentMethod,
  ShareMode,
  CreateExpenseRequest,
  MemberRequest,
  CreateSettlementRequest,
  MemberPixDto,
  PixKeyType,
} from '@/lib/api';
import {
  formatBRL,
  formatDate,
  CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
  PIX_KEY_PLACEHOLDERS,
  PIX_KEY_TYPE_LABELS,
  maskPixKey,
  normalizePixKey,
} from '@/lib/formatters';
import { Modal } from '@/components/ui/Modal';
import { CopyButton } from '@/components/ui/CopyButton';
import { getGroupCredentials, removeSavedGroup, saveGroup } from '@/lib/storage';
import { absoluteUrl, groupPath } from '@/lib/routes';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { PixQrModal } from '@/components/splits/PixQrModal';
import { StatsCharts } from '@/components/despesas/StatsCharts';
import {
  Users,
  Receipt,
  Scale,
  HandCoins,
  BarChart3,
  UserCheck,
  Plus,
  Filter,
  Trash2,
  Edit2,
  Settings,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  QrCode,
  ArrowLeft,
} from 'lucide-react';

type TabType = 'expenses' | 'balances' | 'settlements' | 'stats' | 'members';

const PIX_KEY_TYPE_OPTIONS = (Object.keys(PIX_KEY_TYPE_LABELS) as PixKeyType[]).map((t) => ({
  value: t,
  label: PIX_KEY_TYPE_LABELS[t],
}));

const CATEGORIES: ExpenseCategory[] = [
  'Food',
  'Groceries',
  'Housing',
  'Utilities',
  'Transport',
  'Entertainment',
  'Health',
  'Travel',
  'Shopping',
  'Other',
];

const PAYMENT_METHODS: PaymentMethod[] = [
  'Pix',
  'Cash',
  'CreditCard',
  'DebitCard',
  'BankTransfer',
  'MealVoucher',
  'Other',
];

function GroupDetailContent() {
  const groupId = useSearchParams().get('id') ?? '';
  const router = useRouter();

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>('expenses');

  // Main data states
  const [group, setGroup] = useState<GroupDto | null>(null);
  const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
  const [balances, setBalances] = useState<BalanceDto | null>(null);
  const [settlements, setSettlements] = useState<SettlementDto[]>([]);
  const [stats, setStats] = useState<StatsDto | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // Filter states for Expenses
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [filterMemberId, setFilterMemberId] = useState('');

  // Modals state
  // 1. Expense Modal (Create/Edit)
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmountStr, setExpenseAmountStr] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('Food');
  const [expensePaymentMethod, setExpensePaymentMethod] = useState<PaymentMethod>('Pix');
  const [expensePaidBy, setExpensePaidBy] = useState('');
  const [expenseShareMode, setExpenseShareMode] = useState<ShareMode>('Equal');
  const [expenseShares, setExpenseShares] = useState<
    { memberId: string; amount: string; percentage: string; participating: boolean }[]
  >([]);
  const [expenseNotes, setExpenseNotes] = useState('');
  const [expenseFormError, setExpenseFormError] = useState<string | null>(null);
  const [savingExpense, setSavingExpense] = useState(false);

  // 2. Settlement Modal
  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [settlementFrom, setSettlementFrom] = useState('');
  const [settlementTo, setSettlementTo] = useState('');
  const [settlementAmountStr, setSettlementAmountStr] = useState('');
  const [settlementDate, setSettlementDate] = useState('');
  const [settlementPaymentMethod, setSettlementPaymentMethod] = useState<PaymentMethod>('Pix');
  const [settlementNotes, setSettlementNotes] = useState('');
  const [settlementError, setSettlementError] = useState<string | null>(null);
  const [savingSettlement, setSavingSettlement] = useState(false);

  // 3. Member Modal (Add/Edit)
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberName, setMemberName] = useState('');
  const [memberPixKey, setMemberPixKey] = useState('');
  const [memberPixKeyType, setMemberPixKeyType] = useState<PixKeyType>('Email');
  const [memberError, setMemberError] = useState<string | null>(null);
  const [savingMember, setSavingMember] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<MemberDto | null>(null);
  const [memberDeleteError, setMemberDeleteError] = useState<string | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);

  // Expense deletion modal state
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseDto | null>(null);
  const [expenseDeleteError, setExpenseDeleteError] = useState<string | null>(null);
  const [isDeletingExpense, setIsDeletingExpense] = useState(false);

  // Settlement deletion modal state
  const [settlementToDelete, setSettlementToDelete] = useState<SettlementDto | null>(null);
  const [settlementDeleteError, setSettlementDeleteError] = useState<string | null>(null);
  const [isDeletingSettlement, setIsDeletingSettlement] = useState(false);

  // 4. Pix QR Modal for Creditors
  const [creditorPixData, setCreditorPixData] = useState<MemberPixDto | null>(null);
  const [creditorPixLoading, setCreditorPixLoading] = useState(false);
  const [creditorPixError, setCreditorPixError] = useState<string | null>(null);

  // 5. Group Settings Modal & Group Deletion
  const [groupSettingsModalOpen, setGroupSettingsModalOpen] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDesc, setEditGroupDesc] = useState('');
  const [savingGroupSettings, setSavingGroupSettings] = useState(false);
  const [groupSettingsError, setGroupSettingsError] = useState<string | null>(null);
  const [groupDeleteConfirmOpen, setGroupDeleteConfirmOpen] = useState(false);
  const [groupDeleteError, setGroupDeleteError] = useState<string | null>(null);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);

  // Load Group Details
  const loadGroup = useCallback(async () => {
    try {
      const data = await api.getGroup(groupId);
      setGroup(data);
      setEditGroupName(data.name);
      setEditGroupDesc(data.description || '');
      if (data.members.length > 0 && !expensePaidBy) {
        setExpensePaidBy(data.members[0].id);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Erro ao carregar dados do grupo.');
    }
  }, [groupId, expensePaidBy]);

  // Load Expenses with filters
  const loadExpenses = useCallback(async () => {
    try {
      const data = await api.getExpenses(groupId, {
        from: filterFrom || undefined,
        to: filterTo || undefined,
        category: filterCategory || undefined,
        paymentMethod: filterPaymentMethod || undefined,
        memberId: filterMemberId || undefined,
      });
      setExpenses(data);
    } catch (err: unknown) {
      console.error('Error loading expenses:', err);
    }
  }, [groupId, filterFrom, filterTo, filterCategory, filterPaymentMethod, filterMemberId]);

  // Load Balances
  const loadBalances = useCallback(async () => {
    try {
      const data = await api.getBalances(groupId);
      setBalances(data);
    } catch (err: unknown) {
      console.error('Error loading balances:', err);
    }
  }, [groupId]);

  // Load Settlements
  const loadSettlements = useCallback(async () => {
    try {
      const data = await api.getSettlements(groupId);
      setSettlements(data);
    } catch (err: unknown) {
      console.error('Error loading settlements:', err);
    }
  }, [groupId]);

  // Load Stats
  const loadStats = useCallback(async () => {
    try {
      const data = await api.getStats(groupId, {
        from: filterFrom || undefined,
        to: filterTo || undefined,
      });
      setStats(data);
    } catch (err: unknown) {
      console.error('Error loading stats:', err);
    }
  }, [groupId, filterFrom, filterTo]);

  // Initial Data Fetch
  useEffect(() => {
    async function init() {
      const hashToken = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('t');
      if (hashToken) saveGroup({ id: groupId, accessToken: hashToken });
      const credentials = getGroupCredentials(groupId);
      setIsAdmin(!!credentials?.adminToken);
      const shareToken = credentials?.accessToken ?? credentials?.adminToken;
      setShareUrl(
        `${absoluteUrl(groupPath(groupId))}${shareToken ? `#t=${shareToken}` : ''}`
      );
      setLoading(true);
      setError(null);
      await loadGroup();
      await Promise.all([loadExpenses(), loadBalances(), loadSettlements(), loadStats()]);
      setLoading(false);
    }
    init();
  }, [groupId, loadGroup, loadExpenses, loadBalances, loadSettlements, loadStats]);

  // Sync tab data when tab changes
  useEffect(() => {
    if (activeTab === 'expenses') loadExpenses();
    else if (activeTab === 'balances') loadBalances();
    else if (activeTab === 'settlements') loadSettlements();
    else if (activeTab === 'stats') loadStats();
    else if (activeTab === 'members') loadGroup();
  }, [activeTab, loadExpenses, loadBalances, loadSettlements, loadStats, loadGroup]);

  // Initialize expense shares whenever group members change
  useEffect(() => {
    if (group?.members) {
      setExpenseShares(
        group.members.map((m) => ({
          memberId: m.id,
          amount: '',
          percentage: '',
          participating: true,
        }))
      );
    }
  }, [group?.members]);

  // Handlers for Expenses
  const handleOpenNewExpense = () => {
    setEditingExpenseId(null);
    setExpenseDesc('');
    setExpenseAmountStr('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setExpenseCategory('Food');
    setExpensePaymentMethod('Pix');
    if (group?.members && group.members.length > 0) {
      setExpensePaidBy(group.members[0].id);
      setExpenseShares(
        group.members.map((m) => ({
          memberId: m.id,
          amount: '',
          percentage: '',
          participating: true,
        }))
      );
    }
    setExpenseShareMode('Equal');
    setExpenseNotes('');
    setExpenseFormError(null);
    setExpenseModalOpen(true);
  };

  const handleEditExpense = (expense: ExpenseDto) => {
    setEditingExpenseId(expense.id);
    setExpenseDesc(expense.description);
    setExpenseAmountStr(expense.amount.toString());
    setExpenseDate(expense.date);
    setExpenseCategory(expense.category);
    setExpensePaymentMethod(expense.paymentMethod);
    setExpensePaidBy(expense.paidByMemberId);
    setExpenseShareMode(expense.shareMode);
    setExpenseNotes(expense.notes || '');

    if (group?.members) {
      const shareMap = new Map(expense.shares.map((s) => [s.memberId, s]));
      setExpenseShares(
        group.members.map((m) => {
          const found = shareMap.get(m.id);
          return {
            memberId: m.id,
            amount: found ? found.amount.toString() : '',
            percentage: found?.percentage ? found.percentage.toString() : '',
            participating: !!found,
          };
        })
      );
    }
    setExpenseFormError(null);
    setExpenseModalOpen(true);
  };

  const handleDeleteExpense = (expense: ExpenseDto) => {
    setExpenseToDelete(expense);
    setExpenseDeleteError(null);
  };

  const handleConfirmDeleteExpense = async () => {
    if (!expenseToDelete) return;
    try {
      setIsDeletingExpense(true);
      setExpenseDeleteError(null);
      await api.deleteExpense(groupId, expenseToDelete.id);
      setExpenseToDelete(null);
      await Promise.all([loadExpenses(), loadBalances(), loadStats()]);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Falha ao excluir despesa.';
      setExpenseDeleteError(msg);
    } finally {
      setIsDeletingExpense(false);
    }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseFormError(null);

    const total = parseFloat(expenseAmountStr) || 0;
    if (!expenseDesc.trim()) {
      setExpenseFormError('A descrição é obrigatória.');
      return;
    }
    if (total <= 0) {
      setExpenseFormError('O valor deve ser maior que zero.');
      return;
    }
    if (!expensePaidBy) {
      setExpenseFormError('Selecione quem pagou a despesa.');
      return;
    }

    let payloadShares: { memberId: string; amount?: number | null; percentage?: number | null }[] =
      [];

    if (expenseShareMode === 'Equal') {
      const participating = expenseShares.filter((s) => s.participating);
      if (participating.length === 0) {
        setExpenseFormError('Selecione ao menos um participante na divisão.');
        return;
      }
      payloadShares = participating.map((s) => ({
        memberId: s.memberId,
        amount: null,
        percentage: null,
      }));
    } else if (expenseShareMode === 'Custom') {
      const sum = expenseShares.reduce((acc, s) => acc + (parseFloat(s.amount) || 0), 0);
      if (Math.abs(sum - total) > 0.01) {
        setExpenseFormError(
          `A soma dos valores individuais (${formatBRL(sum)}) deve ser igual ao total da despesa (${formatBRL(total)}).`
        );
        return;
      }
      payloadShares = expenseShares
        .filter((s) => (parseFloat(s.amount) || 0) > 0)
        .map((s) => ({
          memberId: s.memberId,
          amount: parseFloat(s.amount) || 0,
        }));
    } else if (expenseShareMode === 'Percentage') {
      const sum = expenseShares.reduce((acc, s) => acc + (parseFloat(s.percentage) || 0), 0);
      if (Math.abs(sum - 100) > 0.01) {
        setExpenseFormError(`A soma das porcentagens deve ser 100%. Soma atual: ${sum}%.`);
        return;
      }
      payloadShares = expenseShares
        .filter((s) => (parseFloat(s.percentage) || 0) > 0)
        .map((s) => ({
          memberId: s.memberId,
          percentage: parseFloat(s.percentage) || 0,
        }));
    }

    try {
      setSavingExpense(true);
      const payload: CreateExpenseRequest = {
        description: expenseDesc.trim(),
        amount: total,
        date: expenseDate,
        category: expenseCategory,
        paymentMethod: expensePaymentMethod,
        paidByMemberId: expensePaidBy,
        shareMode: expenseShareMode,
        shares: payloadShares,
        notes: expenseNotes.trim() || null,
      };

      if (editingExpenseId) {
        await api.updateExpense(groupId, editingExpenseId, payload);
      } else {
        await api.createExpense(groupId, payload);
      }

      setExpenseModalOpen(false);
      await Promise.all([loadExpenses(), loadBalances(), loadStats()]);
    } catch (err: unknown) {
      if (err instanceof ApiError) setExpenseFormError(err.message);
      else setExpenseFormError('Erro ao salvar despesa.');
    } finally {
      setSavingExpense(false);
    }
  };

  // Handlers for Settlements
  const handleOpenSettlement = (fromId?: string, toId?: string, amount?: number) => {
    setSettlementFrom(fromId || (group?.members[0]?.id ?? ''));
    setSettlementTo(toId || (group?.members[1]?.id ?? ''));
    setSettlementAmountStr(amount ? amount.toString() : '');
    setSettlementDate(new Date().toISOString().split('T')[0]);
    setSettlementPaymentMethod('Pix');
    setSettlementNotes('');
    setSettlementError(null);
    setSettlementModalOpen(true);
  };

  const handleSaveSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettlementError(null);

    const amount = parseFloat(settlementAmountStr) || 0;
    if (amount <= 0) {
      setSettlementError('O valor deve ser maior que zero.');
      return;
    }
    if (settlementFrom === settlementTo) {
      setSettlementError('Quem paga e quem recebe devem ser membros diferentes.');
      return;
    }

    try {
      setSavingSettlement(true);
      const payload: CreateSettlementRequest = {
        fromMemberId: settlementFrom,
        toMemberId: settlementTo,
        amount,
        date: settlementDate,
        paymentMethod: settlementPaymentMethod,
        notes: settlementNotes.trim() || null,
      };

      await api.createSettlement(groupId, payload);
      setSettlementModalOpen(false);
      await Promise.all([loadSettlements(), loadBalances(), loadStats()]);
    } catch (err: unknown) {
      if (err instanceof ApiError) setSettlementError(err.message);
      else setSettlementError('Erro ao registrar acerto.');
    } finally {
      setSavingSettlement(false);
    }
  };

  const handleDeleteSettlement = (settlement: SettlementDto) => {
    setSettlementToDelete(settlement);
    setSettlementDeleteError(null);
  };

  const handleConfirmDeleteSettlement = async () => {
    if (!settlementToDelete) return;
    try {
      setIsDeletingSettlement(true);
      setSettlementDeleteError(null);
      await api.deleteSettlement(groupId, settlementToDelete.id);
      setSettlementToDelete(null);
      await Promise.all([loadSettlements(), loadBalances(), loadStats()]);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Falha ao excluir acerto.';
      setSettlementDeleteError(msg);
    } finally {
      setIsDeletingSettlement(false);
    }
  };

  // Handlers for Pix for Creditor
  const handleGenerateCreditorPix = async (creditorId: string, amount: number) => {
    try {
      setCreditorPixLoading(true);
      setCreditorPixError(null);
      const pix = await api.getMemberPix(groupId, creditorId, amount);
      setCreditorPixData(pix);
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Não foi possível gerar o Pix. Verifique se o membro possui chave Pix cadastrada.';
      setCreditorPixError(msg);
    } finally {
      setCreditorPixLoading(false);
    }
  };

  // Handlers for Members
  const handleOpenMemberModal = (member?: MemberDto) => {
    if (member) {
      setEditingMemberId(member.id);
      setMemberName(member.name);
      const type = member.pixKeyType || 'Email';
      setMemberPixKey(maskPixKey(member.pixKey || '', type));
      setMemberPixKeyType(type);
    } else {
      setEditingMemberId(null);
      setMemberName('');
      setMemberPixKey('');
      setMemberPixKeyType('Email');
    }
    setMemberError(null);
    setMemberModalOpen(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberError(null);

    if (!memberName.trim()) {
      setMemberError('O nome do membro é obrigatório.');
      return;
    }

    try {
      setSavingMember(true);
      const payload: MemberRequest = {
        name: memberName.trim(),
        pixKey: memberPixKey.trim()
          ? normalizePixKey(memberPixKey, memberPixKeyType)
          : null,
        pixKeyType: memberPixKey.trim() ? memberPixKeyType : null,
      };

      if (editingMemberId) {
        await api.updateMember(groupId, editingMemberId, payload);
      } else {
        await api.addMember(groupId, payload);
      }

      setMemberModalOpen(false);
      await Promise.all([loadGroup(), loadBalances()]);
    } catch (err: unknown) {
      if (err instanceof ApiError) setMemberError(err.message);
      else setMemberError('Erro ao salvar membro.');
    } finally {
      setSavingMember(false);
    }
  };

  const handleConfirmDeleteMember = async () => {
    if (!memberToDelete) return;
    try {
      setIsDeletingMember(true);
      setMemberDeleteError(null);
      await api.deleteMember(groupId, memberToDelete.id);
      setMemberToDelete(null);
      await Promise.all([loadGroup(), loadBalances()]);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409) {
        setMemberDeleteError(
          'Não é possível remover este membro pois ele já possui despesas ou acertos vinculados no grupo (Erro 409: Conflito).'
        );
      } else {
        const msg = err instanceof ApiError ? err.message : 'Falha ao remover membro.';
        setMemberDeleteError(msg);
      }
    } finally {
      setIsDeletingMember(false);
    }
  };

  // Handlers for Group Settings
  const handleSaveGroupSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editGroupName.trim()) return;
    setGroupSettingsError(null);
    try {
      setSavingGroupSettings(true);
      const updated = await api.updateGroup(groupId, {
        name: editGroupName.trim(),
        description: editGroupDesc.trim() || null,
      });
      setGroup(updated);
      setGroupSettingsModalOpen(false);
    } catch (err: unknown) {
      setGroupSettingsError(err instanceof ApiError ? err.message : 'Erro ao atualizar grupo.');
    } finally {
      setSavingGroupSettings(false);
    }
  };

  const handleConfirmDeleteGroup = async () => {
    try {
      setIsDeletingGroup(true);
      setGroupDeleteError(null);
      await api.deleteGroup(groupId);
      removeSavedGroup(groupId);
      router.push('/despesas');
    } catch (err: unknown) {
      setGroupDeleteError(err instanceof ApiError ? err.message : 'Erro ao excluir grupo.');
      setIsDeletingGroup(false);
    }
  };

  if (loading && !group) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <RefreshCw className="w-8 h-8 text-zinc-50 animate-spin mb-3" />
        <p className="text-zinc-400 text-sm">Carregando grupo de despesas...</p>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 bg-rose-950/60 text-rose-400 rounded-xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">
          Grupo não encontrado
        </h1>
        <p className="text-zinc-400 text-sm mb-6">
          {error ?? 'Esse grupo não existe ou o link não tem permissão de acesso.'}
        </p>
        <Link
          href="/despesas"
          className="px-4 py-2 bg-zinc-50 text-zinc-950 rounded-xl text-sm font-semibold hover:bg-zinc-100"
        >
          Voltar para grupos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full space-y-6">
      {/* Top Breadcrumb & Header */}
      <div>
        <Link
          href="/despesas"
          className="text-xs font-semibold text-zinc-50 hover:underline mb-2 inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar para lista de grupos
        </Link>

        <div className=" bg-zinc-950 rounded-xl p-6 sm:p-7 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-zinc-900 text-zinc-50">
                <Users className="w-5 h-5" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-semibold text-white">
                {group.name}
              </h1>
            </div>
            {group.description && (
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
                {group.description}
              </p>
            )}
            <p className="text-xs text-zinc-500 mt-2">
              {group.members.length} {group.members.length === 1 ? 'membro' : 'membros'} &bull; Criado em {formatDate(group.createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {shareUrl && (
              <CopyButton
                text={shareUrl}
                label="Compartilhar"
                copiedLabel="Link copiado!"
                variant="outline"
                size="md"
                className="rounded-xl py-2.5"
              />
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setGroupSettingsModalOpen(true)}
                className="p-2.5 rounded-xl border border-zinc-800 text-zinc-300 hover:bg-zinc-900 transition-colors"
                title="Configurações do grupo"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            <button
              type="button"
              onClick={handleOpenNewExpense}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-200 text-zinc-950 font-bold text-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nova Despesa
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center border-b border-zinc-800 overflow-x-auto gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'expenses'
              ? 'border-zinc-700 text-zinc-50'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Despesas ({expenses.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('balances')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'balances'
              ? 'border-zinc-700 text-zinc-50'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Scale className="w-4 h-4" />
          Saldos & Quitação
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settlements')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'settlements'
              ? 'border-zinc-700 text-zinc-50'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <HandCoins className="w-4 h-4" />
          Acertos ({settlements.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('stats')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'stats'
              ? 'border-zinc-700 text-zinc-50'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Resumo & Gráficos
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'members'
              ? 'border-zinc-700 text-zinc-50'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Membros ({group.members.length})
        </button>
      </div>

      {/* Tab 1: Despesas */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-wrap items-center gap-3 text-xs">
            <span className="font-bold text-zinc-300 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-zinc-50" /> Filtros:
            </span>

            <div>
              <input
                type="date"
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
                placeholder="De"
                className="px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900"
              />
            </div>

            <div>
              <input
                type="date"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
                placeholder="Até"
                className="px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900"
              />
            </div>

            <div>
              <Select
                value={filterCategory}
                onChange={(value) => setFilterCategory(value)}
                options={[{ value: '', label: 'Todas Categorias' }, ...CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))]}
                triggerClassName="px-2.5 py-1.5 rounded-lg text-sm"
                className="inline-block"
              />
            </div>

            <div>
              <Select
                value={filterPaymentMethod}
                onChange={(value) => setFilterPaymentMethod(value)}
                options={[{ value: '', label: 'Todos Métodos' }, ...PAYMENT_METHODS.map((p) => ({ value: p, label: PAYMENT_METHOD_LABELS[p] }))]}
                triggerClassName="px-2.5 py-1.5 rounded-lg text-sm"
                className="inline-block"
              />
            </div>

            <div>
              <Select
                value={filterMemberId}
                onChange={(value) => setFilterMemberId(value)}
                options={[{ value: '', label: 'Todos Quem Pagou' }, ...group.members.map((mb) => ({ value: mb.id, label: mb.name }))]}
                triggerClassName="px-2.5 py-1.5 rounded-lg text-sm"
                className="inline-block"
              />
            </div>

            {(filterFrom || filterTo || filterCategory || filterPaymentMethod || filterMemberId) && (
              <button
                type="button"
                onClick={() => {
                  setFilterFrom('');
                  setFilterTo('');
                  setFilterCategory('');
                  setFilterPaymentMethod('');
                  setFilterMemberId('');
                }}
                className="text-xs font-semibold text-zinc-50 hover:underline cursor-pointer ml-auto"
              >
                Limpar Filtros
              </button>
            )}
          </div>

          {/* Expenses List */}
          {expenses.length === 0 ? (
            <div className="py-16 text-center bg-zinc-950 rounded-xl border border-zinc-800 p-8">
              <Receipt className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="font-bold text-zinc-200 text-lg">
                Nenhuma despesa encontrada
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Lançamentos cadastrados aparecem aqui. Clique em &quot;Nova Despesa&quot; para registrar gastos.
              </p>
            </div>
          ) : (
            <div className=" bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800">
              {expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-900/30 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white text-base">
                        {exp.description}
                      </span>
                      <Badge variant="emerald" size="sm">
                        {CATEGORY_LABELS[exp.category]}
                      </Badge>
                      <Badge variant="slate" size="sm">
                        {PAYMENT_METHOD_LABELS[exp.paymentMethod]}
                      </Badge>
                    </div>

                    <p className="text-xs text-zinc-400">
                      Pago por <strong className=" text-zinc-300">{exp.paidByName}</strong> em {formatDate(exp.date)}
                      {exp.notes && <span> &bull; <em>{exp.notes}</em></span>}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-zinc-500">
                      <span>Divisão ({exp.shareMode}):</span>
                      {exp.shares.map((s) => (
                        <span
                          key={s.memberId}
                          className=" bg-zinc-900 px-2 py-0.5 rounded-full text-zinc-300"
                        >
                          {s.memberName}: {formatBRL(s.amount)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <span className="text-xl font-semibold text-white">
                      {formatBRL(exp.amount)}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditExpense(exp)}
                        className="p-2 text-zinc-500 hover:text-zinc-200 rounded-lg transition-colors cursor-pointer"
                        title="Editar despesa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(exp)}
                        className="p-2 text-zinc-500 hover:text-rose-300 rounded-lg transition-colors cursor-pointer"
                        title="Excluir despesa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Saldos & Quitação */}
      {activeTab === 'balances' && balances && (
        <div className="space-y-8">
          {/* Members Balances Overview */}
          <div className=" bg-zinc-950 rounded-xl p-6 sm:p-7 border border-zinc-800 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-zinc-50" />
              Balanço Individual dos Membros
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {balances.members.map((m) => {
                const isPositive = m.net > 0.005;
                const isNegative = m.net < -0.005;

                return (
                  <div
                    key={m.memberId}
                    className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-base">
                        {m.name}
                      </span>
                      {isPositive ? (
                        <Badge variant="emerald" size="sm">
                          A receber
                        </Badge>
                      ) : isNegative ? (
                        <Badge variant="rose" size="sm">
                          Deve
                        </Badge>
                      ) : (
                        <Badge variant="slate" size="sm">
                          Quitado
                        </Badge>
                      )}
                    </div>

                    <div className="text-2xl font-semibold">
                      <span
                        className={
                          isPositive
                            ? 'text-emerald-400'
                            : isNegative
                            ? 'text-rose-400'
                            : 'text-zinc-500'
                        }
                      >
                        {formatBRL(Math.abs(m.net))}
                      </span>
                    </div>

                    <div className="text-xs text-zinc-400 space-y-1 pt-2 border-t border-zinc-800">
                      <div className="flex justify-between">
                        <span>Gastou (Pagou):</span>
                        <strong className=" text-zinc-300">
                          {formatBRL(m.paid)}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Parte Devida:</span>
                        <strong className=" text-zinc-300">
                          {formatBRL(m.owed)}
                        </strong>
                      </div>
                      {(m.settlementsSent > 0 || m.settlementsReceived > 0) && (
                        <div className="flex justify-between text-[11px] text-zinc-500">
                          <span>Acertos (env/rec):</span>
                          <span>
                            +{formatBRL(m.settlementsSent)} / -{formatBRL(m.settlementsReceived)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Suggested Transfers */}
          <div className=" bg-zinc-950 rounded-xl p-6 sm:p-7 border border-zinc-800 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <HandCoins className="w-5 h-5 text-zinc-50" />
                Transferências Sugeridas para Quitação
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Calculado pelo algoritmo de fluxo mínimo para liquidar todas as pendências com o menor número de Pix.
              </p>
            </div>

            {creditorPixError && (
              <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-200 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{creditorPixError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCreditorPixError(null)}
                  className="font-bold underline hover:opacity-80 cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            )}

            {balances.suggestedTransfers.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-sm">
                🎉 Tudo quitado! Nenhuma transferência pendente no grupo.
              </div>
            ) : (
              <div className="space-y-3">
                {balances.suggestedTransfers.map((st, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-900 text-zinc-50 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div className="text-sm">
                        <strong className=" text-white">{st.fromName}</strong>{' '}
                        deve pagar{' '}
                        <span className="font-semibold text-zinc-50">{formatBRL(st.amount)}</span>{' '}
                        para <strong className=" text-white">{st.toName}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleGenerateCreditorPix(st.toMemberId, st.amount)}
                        disabled={creditorPixLoading}
                        className="px-3 py-1.5 rounded-xl border border-zinc-700 text-zinc-50 hover:bg-zinc-900 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        Gerar Pix QR
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenSettlement(st.fromMemberId, st.toMemberId, st.amount)}
                        className="px-3 py-1.5 rounded-xl bg-zinc-50 hover:bg-zinc-200 text-zinc-950 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Registrar Pagamento
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Acertos */}
      {activeTab === 'settlements' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">
              Histórico de Acertos e Pagamentos
            </h2>
            <button
              type="button"
              onClick={() => handleOpenSettlement()}
              className="px-4 py-2 rounded-xl bg-zinc-50 hover:bg-zinc-200 text-zinc-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Registrar Acerto
            </button>
          </div>

          {settlements.length === 0 ? (
            <div className="py-16 text-center bg-zinc-950 rounded-xl border border-zinc-800 p-8">
              <HandCoins className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="font-bold text-zinc-200 text-lg">
                Nenhum acerto registrado ainda
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Quando alguém realizar uma transferência para quitar dívidas, registre aqui para atualizar os saldos.
              </p>
            </div>
          ) : (
            <div className=" bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800">
              {settlements.map((s) => (
                <div
                  key={s.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-zinc-900/30 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <span>{s.fromName}</span>
                      <ArrowRight className="w-4 h-4 text-zinc-50" />
                      <span>{s.toName}</span>
                      <Badge variant="slate" size="sm">
                        {PAYMENT_METHOD_LABELS[s.paymentMethod]}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Realizado em {formatDate(s.date)}
                      {s.notes && <span> &bull; <em>{s.notes}</em></span>}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-base font-semibold text-zinc-50">
                      {formatBRL(s.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSettlement(s)}
                      className="p-1.5 text-zinc-500 hover:text-rose-300 transition-colors cursor-pointer"
                      title="Excluir acerto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Resumo & Gráficos */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Total Gasto no Período
              </span>
              <p className="text-3xl font-semibold text-white mt-1">
                {formatBRL(stats.totalSpent)}
              </p>
            </div>
            <div className="p-6 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Média por Membro
              </span>
              <p className="text-3xl font-semibold text-zinc-50 mt-1">
                {formatBRL(group.members.length > 0 ? stats.totalSpent / group.members.length : 0)}
              </p>
            </div>
          </div>

          <StatsCharts stats={stats} />
        </div>
      )}

      {/* Tab 5: Membros */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">
              Membros do Grupo ({group.members.length})
            </h2>
            <button
              type="button"
              onClick={() => handleOpenMemberModal()}
              className="px-4 py-2 rounded-xl bg-zinc-50 hover:bg-zinc-200 text-zinc-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Adicionar Membro
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {group.members.map((m) => (
              <div
                key={m.id}
                className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 text-zinc-50 font-semibold flex items-center justify-center">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">
                        {m.name}
                      </h3>
                      {m.pixKey ? (
                        <p className="text-xs text-zinc-500 font-mono">
                          Pix: {m.pixKey} ({m.pixKeyType ? PIX_KEY_TYPE_LABELS[m.pixKeyType] : ''})
                        </p>
                      ) : (
                        <p className="text-xs text-zinc-500 italic">Sem Pix cadastrado</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => handleOpenMemberModal(m)}
                    className="p-2 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-900 transition-colors text-xs font-semibold flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Editar
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setMemberToDelete(m);
                        setMemberDeleteError(null);
                      }}
                      className="p-2 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-950/40 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remover
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Nova/Editar Despesa */}
      <Modal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        title={editingExpenseId ? 'Editar Despesa' : 'Nova Despesa'}
        description="Registre os detalhes e como o valor será distribuído entre os membros."
        maxWidth="xl"
      >
        <form onSubmit={handleSaveExpense} className="space-y-4">
          {expenseFormError && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{expenseFormError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Descrição *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Compras no Supermercado, Aluguel, Combustível"
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Valor Total (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={expenseAmountStr}
                onChange={(e) => setExpenseAmountStr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-sm font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Data *
              </label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Categoria *
              </label>
              <Select
                value={expenseCategory}
                onChange={(value) => setExpenseCategory(value as ExpenseCategory)}
                options={CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
                triggerClassName="px-3 py-2 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Forma de Pagamento *
              </label>
              <Select
                value={expensePaymentMethod}
                onChange={(value) => setExpensePaymentMethod(value as PaymentMethod)}
                options={PAYMENT_METHODS.map((p) => ({ value: p, label: PAYMENT_METHOD_LABELS[p] }))}
                triggerClassName="px-3 py-2 rounded-xl text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Quem Pagou? *
              </label>
              <Select
                value={expensePaidBy}
                onChange={(value) => setExpensePaidBy(value)}
                options={group.members.map((mb) => ({ value: mb.id, label: mb.name }))}
                triggerClassName="px-3 py-2 rounded-xl text-sm font-semibold"
              />
            </div>
          </div>

          {/* Division Mode */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300">
                Divisão entre Membros *
              </label>
              <div className="flex gap-1 text-xs">
                {(['Equal', 'Custom', 'Percentage'] as ShareMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setExpenseShareMode(mode)}
                    className={`px-2.5 py-1 rounded-lg border font-semibold ${
                      expenseShareMode === mode
                        ? 'bg-zinc-50 text-zinc-950 border-zinc-700'
                        : ' border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                    }`}
                  >
                    {mode === 'Equal'
                      ? 'Igual'
                      : mode === 'Custom'
                      ? 'Valores'
                      : 'Porcentagem'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {expenseShares.map((s) => {
                const member = group.members.find((m) => m.id === s.memberId);
                if (!member) return null;

                return (
                  <div
                    key={s.memberId}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800 text-xs"
                  >
                    <label className="flex items-center gap-2 cursor-pointer">
                      {expenseShareMode === 'Equal' && (
                        <input
                          type="checkbox"
                          checked={s.participating}
                          onChange={(e) =>
                            setExpenseShares((prev) =>
                              prev.map((item) =>
                                item.memberId === s.memberId
                                  ? { ...item, participating: e.target.checked }
                                  : item
                              )
                            )
                          }
                          className="rounded text-zinc-50"
                        />
                      )}
                      <span className="font-semibold text-zinc-200">
                        {member.name}
                      </span>
                    </label>

                    {expenseShareMode === 'Custom' && (
                      <div className="flex items-center gap-1 w-28">
                        <span>R$</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={s.amount}
                          onChange={(e) =>
                            setExpenseShares((prev) =>
                              prev.map((item) =>
                                item.memberId === s.memberId
                                  ? { ...item, amount: e.target.value }
                                  : item
                              )
                            )
                          }
                          className="w-full px-2 py-1 rounded border border-zinc-700 bg-zinc-950 text-right font-bold"
                        />
                      </div>
                    )}

                    {expenseShareMode === 'Percentage' && (
                      <div className="flex items-center gap-1 w-24">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          value={s.percentage}
                          onChange={(e) =>
                            setExpenseShares((prev) =>
                              prev.map((item) =>
                                item.memberId === s.memberId
                                  ? { ...item, percentage: e.target.value }
                                  : item
                              )
                            )
                          }
                          className="w-full px-2 py-1 rounded border border-zinc-700 bg-zinc-950 text-right font-bold"
                        />
                        <span>%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Observações (opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Compra parcelada, cupom aplicado..."
              value={expenseNotes}
              onChange={(e) => setExpenseNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-xs focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setExpenseModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-900 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingExpense}
              className="px-4 py-2 text-xs font-bold text-zinc-950 bg-zinc-50 hover:bg-zinc-200 rounded-xl cursor-pointer disabled:opacity-50"
            >
              {savingExpense ? 'Salvando...' : 'Salvar Despesa'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Registrar Acerto */}
      <Modal
        isOpen={settlementModalOpen}
        onClose={() => setSettlementModalOpen(false)}
        title="Registrar Acerto de Contas"
        description="Registre uma transferência de dinheiro entre membros para abater saldos."
        maxWidth="md"
      >
        <form onSubmit={handleSaveSettlement} className="space-y-4">
          {settlementError && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{settlementError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Quem Pagou (Devedor) *
              </label>
              <Select
                value={settlementFrom}
                onChange={(value) => setSettlementFrom(value)}
                options={group.members.map((mb) => ({ value: mb.id, label: mb.name }))}
                triggerClassName="px-3 py-2 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Quem Recebeu (Credor) *
              </label>
              <Select
                value={settlementTo}
                onChange={(value) => setSettlementTo(value)}
                options={group.members.map((mb) => ({ value: mb.id, label: mb.name }))}
                triggerClassName="px-3 py-2 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Valor (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={settlementAmountStr}
                onChange={(e) => setSettlementAmountStr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Data *
              </label>
              <input
                type="date"
                required
                value={settlementDate}
                onChange={(e) => setSettlementDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-xs focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Método de Pagamento *
            </label>
            <Select
              value={settlementPaymentMethod}
              onChange={(value) => setSettlementPaymentMethod(value as PaymentMethod)}
              options={PAYMENT_METHODS.map((p) => ({ value: p, label: PAYMENT_METHOD_LABELS[p] }))}
              triggerClassName="px-3 py-2 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Observações (opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Pix comprovante enviado no WhatsApp"
              value={settlementNotes}
              onChange={(e) => setSettlementNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-xs focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setSettlementModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-900 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingSettlement}
              className="px-4 py-2 text-xs font-bold text-zinc-950 bg-zinc-50 hover:bg-zinc-200 rounded-xl cursor-pointer disabled:opacity-50"
            >
              {savingSettlement ? 'Registrando...' : 'Confirmar Acerto'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Adicionar/Editar Membro */}
      <Modal
        isOpen={memberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        title={editingMemberId ? 'Editar Membro' : 'Novo Membro'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveMember} className="space-y-4">
          {memberError && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{memberError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Nome do Membro *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: João, Maria, Pedro"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-xs focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Tipo Pix
              </label>
              <Select
                value={memberPixKeyType}
                onChange={(value) => {
                  const nextType = value as PixKeyType;
                  setMemberPixKeyType(nextType);
                  setMemberPixKey((current) => maskPixKey(current, nextType));
                }}
                options={PIX_KEY_TYPE_OPTIONS}
                triggerClassName="px-2 py-2 rounded-xl text-xs"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Chave Pix (opcional)
              </label>
              <input
                type="text"
                inputMode={memberPixKeyType === 'Email' || memberPixKeyType === 'Random' ? 'text' : 'numeric'}
                placeholder={PIX_KEY_PLACEHOLDERS[memberPixKeyType]}
                value={memberPixKey}
                onChange={(e) => setMemberPixKey(maskPixKey(e.target.value, memberPixKeyType))}
                className="w-full px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-mono focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setMemberModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-900 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingMember}
              className="px-4 py-2 text-xs font-bold text-zinc-950 bg-zinc-50 hover:bg-zinc-200 rounded-xl cursor-pointer disabled:opacity-50"
            >
              {savingMember ? 'Salvando...' : 'Salvar Membro'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirmar Remoção de Membro */}
      <Modal
        isOpen={!!memberToDelete}
        onClose={() => {
          setMemberToDelete(null);
          setMemberDeleteError(null);
        }}
        title="Remover Membro do Grupo"
        maxWidth="md"
      >
        <div className="space-y-4">
          {memberDeleteError && (
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{memberDeleteError}</span>
            </div>
          )}

          <p className="text-sm text-zinc-300">
            Deseja realmente remover <strong>{memberToDelete?.name}</strong> do grupo?
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setMemberToDelete(null);
                setMemberDeleteError(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isDeletingMember}
              onClick={handleConfirmDeleteMember}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer disabled:opacity-50"
            >
              {isDeletingMember ? 'Removendo...' : 'Confirmar Remoção'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Pix QR Modal para Credor nos Saldos */}
      {creditorPixData && (
        <PixQrModal
          isOpen={!!creditorPixData}
          onClose={() => setCreditorPixData(null)}
          title={`Pagar ${creditorPixData.name} via Pix`}
          receiverName={creditorPixData.name}
          amount={creditorPixData.amount}
          pixCode={creditorPixData.pixCode}
          pixKey={creditorPixData.pixKey}
        />
      )}

      {/* Modal: Configurações do Grupo */}
      <Modal
        isOpen={groupSettingsModalOpen}
        onClose={() => {
          setGroupSettingsModalOpen(false);
          setGroupSettingsError(null);
        }}
        title="Configurações do Grupo"
        maxWidth="md"
      >
        <div className="space-y-5">
          {groupSettingsError && (
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{groupSettingsError}</span>
            </div>
          )}

          <form onSubmit={handleSaveGroupSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Nome do Grupo
              </label>
              <input
                type="text"
                required
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Descrição
              </label>
              <input
                type="text"
                value={editGroupDesc}
                onChange={(e) => setEditGroupDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-xs focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="submit"
                disabled={savingGroupSettings}
                className="px-4 py-2 text-xs font-bold text-zinc-950 bg-zinc-50 hover:bg-zinc-200 rounded-xl cursor-pointer disabled:opacity-50"
              >
                {savingGroupSettings ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>

          <div className="pt-4 border-t border-zinc-800 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Zona de Perigo
            </h4>
            <p className="text-xs text-zinc-500">
              Excluir este grupo apagará todas as despesas, acertos e registros para sempre.
            </p>
            <button
              type="button"
              onClick={() => {
                setGroupSettingsModalOpen(false);
                setGroupDeleteError(null);
                setGroupDeleteConfirmOpen(true);
              }}
              className="px-4 py-2 text-xs font-bold text-rose-400 border border-rose-800 hover:bg-rose-950/40 rounded-xl cursor-pointer"
            >
              Excluir Grupo Definitivamente
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Confirmar Remoção de Despesa */}
      <Modal
        isOpen={!!expenseToDelete}
        onClose={() => {
          setExpenseToDelete(null);
          setExpenseDeleteError(null);
        }}
        title="Excluir Despesa"
        maxWidth="md"
      >
        <div className="space-y-4">
          {expenseDeleteError && (
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{expenseDeleteError}</span>
            </div>
          )}

          <p className="text-sm text-zinc-300">
            Deseja realmente excluir a despesa <strong>{expenseToDelete?.description}</strong> no valor de <strong>{expenseToDelete ? formatBRL(expenseToDelete.amount) : ''}</strong>?
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setExpenseToDelete(null);
                setExpenseDeleteError(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isDeletingExpense}
              onClick={handleConfirmDeleteExpense}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer disabled:opacity-50"
            >
              {isDeletingExpense ? 'Excluindo...' : 'Confirmar Exclusão'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Confirmar Remoção de Acerto */}
      <Modal
        isOpen={!!settlementToDelete}
        onClose={() => {
          setSettlementToDelete(null);
          setSettlementDeleteError(null);
        }}
        title="Excluir Registro de Acerto"
        maxWidth="md"
      >
        <div className="space-y-4">
          {settlementDeleteError && (
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{settlementDeleteError}</span>
            </div>
          )}

          <p className="text-sm text-zinc-300">
            Deseja realmente excluir o acerto de <strong>{settlementToDelete ? formatBRL(settlementToDelete.amount) : ''}</strong> pago por <strong>{settlementToDelete?.fromName}</strong> para <strong>{settlementToDelete?.toName}</strong>?
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setSettlementToDelete(null);
                setSettlementDeleteError(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isDeletingSettlement}
              onClick={handleConfirmDeleteSettlement}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer disabled:opacity-50"
            >
              {isDeletingSettlement ? 'Excluindo...' : 'Confirmar Exclusão'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Confirmar Exclusão de Grupo */}
      <Modal
        isOpen={groupDeleteConfirmOpen}
        onClose={() => {
          setGroupDeleteConfirmOpen(false);
          setGroupDeleteError(null);
        }}
        title="Excluir Grupo de Despesas"
        maxWidth="md"
      >
        <div className="space-y-4">
          {groupDeleteError && (
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{groupDeleteError}</span>
            </div>
          )}

          <p className="text-sm text-zinc-300">
            Tem certeza absoluta que deseja excluir o grupo <strong>{group?.name}</strong> e todo o seu histórico de despesas e acertos? Esta ação não pode ser desfeita.
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setGroupDeleteConfirmOpen(false);
                setGroupDeleteError(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isDeletingGroup}
              onClick={handleConfirmDeleteGroup}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer disabled:opacity-50"
            >
              {isDeletingGroup ? 'Excluindo...' : 'Sim, excluir grupo definitivamente'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function GroupDetailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="py-24 flex flex-col items-center justify-center">
          <RefreshCw className="w-8 h-8 text-zinc-50 animate-spin mb-3" />
          <p className="text-zinc-400 text-sm">Carregando grupo de despesas...</p>
        </div>
      }
    >
      <GroupDetailContent />
    </React.Suspense>
  );
}
