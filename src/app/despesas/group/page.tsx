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
  ShareMode,
  CreateExpenseRequest,
  MemberRequest,
  CreateSettlementRequest,
  MemberPixDto,
  PixKeyType,
  SuggestedTransferDto,
} from '@/lib/api';
import {
  formatBRL,
  CATEGORY_LABELS,
  PIX_KEY_PLACEHOLDERS,
  PIX_KEY_TYPE_LABELS,
  maskPixKey,
  normalizePixKey,
} from '@/lib/formatters';
import { Modal } from '@/components/ui/Modal';
import { getGroupCredentials, removeSavedGroup, saveGroup, forgetMemberIdentity } from '@/lib/storage';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { PixQrModal } from '@/components/splits/PixQrModal';
import { StatsCharts } from '@/components/despesas/StatsCharts';
import { Money } from '@/components/ui/Money';
import { toast } from '@/components/ui/Toast';
import { useTermsAccepted, TermsConsentCheckbox, TermsShortNotice } from '@/components/TermsConsent';
import { IdentityPicker } from '@/components/despesas/IdentityPicker';
import { InvitePanel } from '@/components/despesas/InvitePanel';
import {
  Plus,
  Trash2,
  Edit2,
  Settings,
  AlertCircle,
  RefreshCw,
  QrCode,
  ArrowLeft,
  Utensils,
  ShoppingCart,
  Home,
  Zap,
  Car,
  Clapperboard,
  HeartPulse,
  Plane,
  ShoppingBag,
  CircleEllipsis,
  Receipt,
  ArrowLeftRight,
  Check,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';

type TabType = 'expenses' | 'balances' | 'settlements' | 'stats' | 'members';

const PIX_KEY_TYPE_OPTIONS = (Object.keys(PIX_KEY_TYPE_LABELS) as PixKeyType[]).map((t) => ({
  value: t,
  label: PIX_KEY_TYPE_LABELS[t],
}));

const CATEGORIES: ExpenseCategory[] = [
  'Uncategorized',
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

const CATEGORY_STYLE: Record<ExpenseCategory, { icon: LucideIcon; cls: string }> = {
  Food: { icon: Utensils, cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/25' },
  Groceries: { icon: ShoppingCart, cls: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' },
  Housing: { icon: Home, cls: 'bg-blue-500/15 text-blue-400 border border-blue-500/25' },
  Utilities: { icon: Zap, cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/25' },
  Transport: { icon: Car, cls: 'bg-blue-500/15 text-blue-400 border border-blue-500/25' },
  Entertainment: { icon: Clapperboard, cls: 'bg-purple-500/15 text-purple-400 border border-purple-500/25' },
  Health: { icon: HeartPulse, cls: 'bg-rose-500/15 text-rose-400 border border-rose-500/25' },
  Travel: { icon: Plane, cls: 'bg-blue-500/15 text-blue-400 border border-blue-500/25' },
  Shopping: { icon: ShoppingBag, cls: 'bg-purple-500/15 text-purple-400 border border-purple-500/25' },
  Other: { icon: CircleEllipsis, cls: 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/60' },
  Uncategorized: { icon: CircleEllipsis, cls: 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/60' },
};

function isoDay(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 'Hoje', 'Ontem' ou '12 out'. */
function dayLabel(date: string): string {
  const day = date.slice(0, 10);
  const now = new Date();
  if (day === isoDay(now)) return 'Hoje';
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  if (day === isoDay(y)) return 'Ontem';
  const [yy, mm, dd] = day.split('-').map(Number);
  if (!yy || !mm || !dd) return date;
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' })
    .format(new Date(yy, mm - 1, dd))
    .replace('.', '');
}

function groupByDay<T extends { date: string }>(items: T[]): { key: string; label: string; items: T[] }[] {
  const map = new Map<string, T[]>();
  for (const it of [...items].sort((a, b) => b.date.localeCompare(a.date))) {
    const k = it.date.slice(0, 10);
    map.set(k, [...(map.get(k) ?? []), it]);
  }
  return [...map.entries()].map(([key, list]) => ({ key, label: dayLabel(key), items: list }));
}

type PillTone = 'emerald' | 'amber' | 'rose' | 'neutral';
const PILL_STYLE: Record<PillTone, string> = {
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  rose: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  neutral: 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60',
};
const PILL_DOT: Record<PillTone, string> = {
  emerald: 'bg-emerald-400',
  amber: 'bg-amber-400',
  rose: 'bg-rose-400',
  neutral: 'bg-zinc-500',
};

function StatusPill({ tone, children }: Readonly<{ tone: PillTone; children: React.ReactNode }>) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border text-xs font-medium px-2.5 py-0.5 ${PILL_STYLE[tone]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${PILL_DOT[tone]}`} />
      {children}
    </span>
  );
}

function DayHeader({ label }: Readonly<{ label: string }>) {
  return (
    <div className="sticky top-0 z-10 pt-4 pb-2 bg-background/95 backdrop-blur-sm text-xs font-semibold uppercase tracking-wider text-zinc-400">
      {label}
    </div>
  );
}

function errorMessageOr(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

function getExpenseStatus(exp: ExpenseDto): { label: string; title: string; tone: PillTone } | null {
  // Confirmadores de uma despesa = shares.map(memberId) menos paidByMemberId
  const requiredConfirmers = exp.shares
    .map((s) => s.memberId)
    .filter((id) => id !== exp.paidByMemberId);

  if (requiredConfirmers.length === 0) {
    return null;
  }

  const contestedConfirmations = exp.confirmations.filter(
    (c) => requiredConfirmers.includes(c.memberId) && c.status === 'Contested'
  );

  if (contestedConfirmations.length > 0) {
    const comments = contestedConfirmations
      .map((c) => (c.comment ? `${c.memberName}: "${c.comment}"` : `${c.memberName} contestou`))
      .join('; ');
    return {
      label: 'Contestada',
      title: comments,
      tone: 'amber',
    };
  }

  const confirmedCount = exp.confirmations.filter(
    (c) => requiredConfirmers.includes(c.memberId) && c.status === 'Confirmed'
  ).length;
  const totalCount = requiredConfirmers.length;

  if (confirmedCount === totalCount) {
    return {
      label: `Confirmada ${confirmedCount}/${totalCount}`,
      title: 'Todos os confirmadores concordaram',
      tone: 'emerald',
    };
  }

  return {
    label: `Aguardando ${confirmedCount}/${totalCount}`,
    title: `${confirmedCount} de ${totalCount} confirmaram`,
    tone: 'neutral',
  };
}

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
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const { accepted: termsAccepted } = useTermsAccepted();

  // Filter states for Expenses
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMemberId, setFilterMemberId] = useState('');

  // Modals state
  // 1. Expense Modal (Create/Edit)
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmountStr, setExpenseAmountStr] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('Uncategorized');
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
  const [resettingMemberId, setResettingMemberId] = useState<string | null>(null);
  const [isResettingClaim, setIsResettingClaim] = useState(false);

  // Expense deletion modal state
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseDto | null>(null);
  const [expenseDeleteError, setExpenseDeleteError] = useState<string | null>(null);
  const [isDeletingExpense, setIsDeletingExpense] = useState(false);

  // Expense confirmation states
  const [confirmingExpenseId, setConfirmingExpenseId] = useState<string | null>(null);
  const [contestTarget, setContestTarget] = useState<ExpenseDto | null>(null);
  const [contestComment, setContestComment] = useState('');
  const [savingContest, setSavingContest] = useState(false);

  // Settlement deletion and confirmation modal state
  const [settlementToDelete, setSettlementToDelete] = useState<SettlementDto | null>(null);
  const [settlementDeleteError, setSettlementDeleteError] = useState<string | null>(null);
  const [isDeletingSettlement, setIsDeletingSettlement] = useState(false);
  const [confirmingSettlementId, setConfirmingSettlementId] = useState<string | null>(null);

  // 4. Pix QR Modal for Creditors
  const [creditorPixData, setCreditorPixData] = useState<MemberPixDto | null>(null);
  const [creditorPixTransfer, setCreditorPixTransfer] = useState<SuggestedTransferDto | null>(null);
  const [creditorPixPaid, setCreditorPixPaid] = useState(false);
  const [creditorPixMarkingPaid, setCreditorPixMarkingPaid] = useState(false);
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

  // Identity and permission state directly from backend response
  const me = group?.yourMemberId ?? null;
  const isAdmin = group?.isAdmin ?? false;
  const canWrite = !!me || isAdmin;

  let deleteSettlementLabel = 'Confirmar Exclusão';
  if (isDeletingSettlement) deleteSettlementLabel = 'Processando...';
  else if (settlementToDelete?.status === 'Pending' && me === settlementToDelete.toMemberId) {
    deleteSettlementLabel = 'Confirmar Recusa';
  }

  // Load Group Details
  const applyGroupData = useCallback((data: GroupDto) => {
    setGroup(data);
    saveGroup({
      id: data.id,
      name: data.name,
      accessToken: data.accessToken ?? undefined,
      adminToken: data.adminToken ?? undefined,
    });
    setEditGroupName(data.name);
    setEditGroupDesc(data.description || '');
  }, []);

  const loadGroup = useCallback(async () => {
    if (!groupId) return;
    try {
      const data = await api.getGroup(groupId);
      applyGroupData(data);
      if (data.members.length > 0) {
        setExpensePaidBy((prev) => prev || data.yourMemberId || data.members[0].id);
        setExpenseShares((prev) =>
          prev.length > 0
            ? prev
            : data.members.map((m) => ({
                memberId: m.id,
                amount: '',
                percentage: '',
                participating: true,
              }))
        );
      }
      setError(null);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 404 && getGroupCredentials(groupId)?.memberToken) {
        forgetMemberIdentity(groupId);
        try {
          applyGroupData(await api.getGroup(groupId));
          setError(null);
        } catch (retryErr: unknown) {
          setError(errorMessageOr(retryErr, 'Erro ao carregar dados do grupo.'));
        }
        return;
      }
      setError(errorMessageOr(err, 'Erro ao carregar dados do grupo.'));
    }
  }, [groupId, applyGroupData]);

  const checkAndResetIdentityOn404 = useCallback(
    async (err: unknown): Promise<boolean> => {
      if (err instanceof ApiError && err.status === 404 && getGroupCredentials(groupId)?.memberToken) {
        forgetMemberIdentity(groupId);
        await loadGroup();
        return true;
      }
      return false;
    },
    [groupId, loadGroup]
  );

  // Load Expenses with filters
  const loadExpenses = useCallback(async () => {
    if (!groupId) return;
    if (filterFrom && filterTo && filterFrom > filterTo) {
      toast.error('A data inicial deve ser anterior ou igual à data final.');
      return;
    }
    try {
      const data = await api.getExpenses(groupId, {
        from: filterFrom || undefined,
        to: filterTo || undefined,
        category: filterCategory || undefined,
        memberId: filterMemberId || undefined,
      });
      setExpenses(data);
    } catch (err: unknown) {
      if (await checkAndResetIdentityOn404(err)) return;
      console.error('Error loading expenses:', err);
    }
  }, [groupId, filterFrom, filterTo, filterCategory, filterMemberId, checkAndResetIdentityOn404]);

  // Load Balances
  const loadBalances = useCallback(async () => {
    if (!groupId) return;
    try {
      const data = await api.getBalances(groupId);
      setBalances(data);
    } catch (err: unknown) {
      if (await checkAndResetIdentityOn404(err)) return;
      console.error('Error loading balances:', err);
    }
  }, [groupId, checkAndResetIdentityOn404]);

  // Load Settlements
  const loadSettlements = useCallback(async () => {
    if (!groupId) return;
    try {
      const data = await api.getSettlements(groupId);
      setSettlements(data);
    } catch (err: unknown) {
      if (await checkAndResetIdentityOn404(err)) return;
      console.error('Error loading settlements:', err);
    }
  }, [groupId, checkAndResetIdentityOn404]);

  // Load Stats
  const loadStats = useCallback(async () => {
    if (!groupId) return;
    if (filterFrom && filterTo && filterFrom > filterTo) return;
    try {
      const data = await api.getStats(groupId, {
        from: filterFrom || undefined,
        to: filterTo || undefined,
      });
      setStats(data);
    } catch (err: unknown) {
      if (await checkAndResetIdentityOn404(err)) return;
      console.error('Error loading stats:', err);
    }
  }, [groupId, filterFrom, filterTo, checkAndResetIdentityOn404]);

  // Initial Data Fetch (runs once per groupId)
  useEffect(() => {
    if (!groupId) {
      setError('Grupo não encontrado.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function init() {
      const hashToken = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('t');
      if (hashToken) saveGroup({ id: groupId, accessToken: hashToken });
      setLoading(true);
      setError(null);
      await loadGroup();
      await Promise.all([loadExpenses(), loadBalances(), loadSettlements(), loadStats()]);
      if (!cancelled) setLoading(false);
    }
    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // Sync tab data when tab or filters change (after initial load)
  useEffect(() => {
    if (loading) return;
    if (activeTab === 'expenses') loadExpenses();
    else if (activeTab === 'balances') loadBalances();
    else if (activeTab === 'settlements') loadSettlements();
    else if (activeTab === 'stats') loadStats();
    else if (activeTab === 'members') loadGroup();
  }, [activeTab, loading, loadExpenses, loadBalances, loadSettlements, loadStats, loadGroup]);

  // Handler for Claiming Identity
  const handleClaim = async (req: { memberId?: string; newName?: string }) => {
    try {
      const res = await api.claimMember(groupId, req);
      saveGroup({
        id: groupId,
        memberToken: res.memberToken,
        memberId: res.member.id,
      });
      await loadGroup();
      await Promise.all([loadExpenses(), loadBalances(), loadSettlements(), loadStats()]);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        throw new Error(err.message);
      }
      throw err;
    }
  };

  // Handler for Rotating Invite Token
  const handleRotateInvite = async () => {
    try {
      const res = await api.rotateInvite(groupId);
      saveGroup({ id: groupId, accessToken: res.accessToken });
      await loadGroup();
      toast.success('Novo link de convite gerado com sucesso!');
    } catch (err: unknown) {
      if (await checkAndResetIdentityOn404(err)) return;
      toast.error(err instanceof ApiError ? err.message : 'Erro ao gerar novo convite.');
    }
  };

  // Handlers for Expenses
  const handleOpenNewExpense = () => {
    setEditingExpenseId(null);
    setExpenseDesc('');
    setExpenseAmountStr('');
    setExpenseDate(isoDay(new Date()));
    setExpenseCategory('Uncategorized');
    if (group?.members && group.members.length > 0) {
      setExpensePaidBy(me || group.members[0].id);
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
      toast.success('Despesa excluída com sucesso!');
      await Promise.all([loadExpenses(), loadBalances(), loadStats()]);
    } catch (err: unknown) {
      if (await checkAndResetIdentityOn404(err)) return;
      const msg = err instanceof ApiError ? err.message : 'Falha ao excluir despesa.';
      setExpenseDeleteError(msg);
    } finally {
      setIsDeletingExpense(false);
    }
  };

  const handleConfirmExpense = async (
    expenseId: string,
    status: 'Confirmed' | 'Contested',
    comment?: string | null
  ) => {
    try {
      setConfirmingExpenseId(expenseId);
      const updated = await api.confirmExpense(groupId, expenseId, { status, comment });
      setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      toast.success(status === 'Confirmed' ? 'Despesa confirmada!' : 'Despesa contestada!');
    } catch (err: unknown) {
      if (await checkAndResetIdentityOn404(err)) return;
      toast.error(err instanceof ApiError ? err.message : 'Erro ao registrar confirmação.');
    } finally {
      setConfirmingExpenseId(null);
    }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseFormError(null);

    const total = Number.parseFloat(expenseAmountStr) || 0;
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
      if (expenseShares.some((s) => (Number.parseFloat(s.amount) || 0) < 0)) {
        setExpenseFormError('Os valores individuais não podem ser negativos.');
        return;
      }
      const sum = expenseShares.reduce((acc, s) => acc + (Number.parseFloat(s.amount) || 0), 0);
      if (Math.round(sum * 100) !== Math.round(total * 100)) {
        setExpenseFormError(
          `A soma dos valores individuais (${formatBRL(sum)}) deve ser igual ao total da despesa (${formatBRL(total)}).`
        );
        return;
      }
      payloadShares = expenseShares
        .filter((s) => (Number.parseFloat(s.amount) || 0) > 0)
        .map((s) => ({
          memberId: s.memberId,
          amount: Number.parseFloat(s.amount) || 0,
        }));
    } else if (expenseShareMode === 'Percentage') {
      if (expenseShares.some((s) => (Number.parseFloat(s.percentage) || 0) < 0)) {
        setExpenseFormError('As porcentagens não podem ser negativas.');
        return;
      }
      const sum = expenseShares.reduce((acc, s) => acc + (Number.parseFloat(s.percentage) || 0), 0);
      if (Math.abs(sum - 100) > 0.01) {
        setExpenseFormError(`A soma das porcentagens deve ser 100%. Soma atual: ${sum}%.`);
        return;
      }
      payloadShares = expenseShares
        .filter((s) => (Number.parseFloat(s.percentage) || 0) > 0)
        .map((s) => ({
          memberId: s.memberId,
          percentage: Number.parseFloat(s.percentage) || 0,
        }));
    }

    try {
      setSavingExpense(true);
      const payload: CreateExpenseRequest = {
        description: expenseDesc.trim(),
        amount: total,
        date: expenseDate,
        category: expenseCategory,
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
      if (await checkAndResetIdentityOn404(err)) return;
      if (err instanceof ApiError) setExpenseFormError(err.message);
      else setExpenseFormError('Erro ao salvar despesa.');
    } finally {
      setSavingExpense(false);
    }
  };

  // Handlers for Settlements
  const handleOpenSettlement = (fromId?: string, toId?: string, amount?: number) => {
    let initialFrom = fromId;
    let initialTo = toId;

    if (!initialFrom) {
      initialFrom = me || (group?.members[0]?.id ?? '');
    }

    if (!initialTo) {
      const other = group?.members.find((m) => m.id !== initialFrom);
      initialTo = other?.id ?? '';
    }

    if (!isAdmin && me) {
      if (initialFrom !== me && initialTo !== me) {
        initialFrom = me;
        const other = group?.members.find((m) => m.id !== me);
        initialTo = other?.id ?? '';
      }
    }

    setSettlementFrom(initialFrom);
    setSettlementTo(initialTo);
    setSettlementAmountStr(amount ? amount.toString() : '');
    setSettlementDate(isoDay(new Date()));
    setSettlementNotes('');
    setSettlementError(null);
    setSettlementModalOpen(true);
  };

  const handleSaveSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettlementError(null);

    const amount = Number.parseFloat(settlementAmountStr) || 0;
    if (amount <= 0) {
      setSettlementError('O valor deve ser maior que zero.');
      return;
    }
    if (!settlementFrom || !settlementTo) {
      setSettlementError('Selecione quem pagou e quem recebeu.');
      return;
    }
    if (settlementFrom === settlementTo) {
      setSettlementError('Quem paga e quem recebe devem ser membros diferentes.');
      return;
    }
    if (!isAdmin && me && settlementFrom !== me && settlementTo !== me) {
      setSettlementError('Você só pode registrar acertos em que você paga ou recebe.');
      return;
    }

    try {
      setSavingSettlement(true);
      const payload: CreateSettlementRequest = {
        fromMemberId: settlementFrom,
        toMemberId: settlementTo,
        amount,
        date: settlementDate,
        notes: settlementNotes.trim() || null,
      };

      await api.createSettlement(groupId, payload);
      setSettlementModalOpen(false);
      toast.success('Acerto registrado com sucesso!');
      await Promise.all([loadSettlements(), loadBalances(), loadStats()]);
    } catch (err: unknown) {
      if (await checkAndResetIdentityOn404(err)) return;
      if (err instanceof ApiError) setSettlementError(err.message);
      else setSettlementError('Erro ao registrar acerto.');
    } finally {
      setSavingSettlement(false);
    }
  };

  const handleConfirmSettlement = async (settlementId: string) => {
    try {
      setConfirmingSettlementId(settlementId);
      await api.confirmSettlement(groupId, settlementId);
      toast.success('Recebimento confirmado!');
      await Promise.all([loadSettlements(), loadBalances(), loadStats()]);
    } catch (err: unknown) {
      if (await checkAndResetIdentityOn404(err)) return;
      toast.error(err instanceof ApiError ? err.message : 'Erro ao confirmar recebimento.');
    } finally {
      setConfirmingSettlementId(null);
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
      const isRefuse = settlementToDelete.status === 'Pending' && me === settlementToDelete.toMemberId;
      setSettlementToDelete(null);
      toast.success(isRefuse ? 'Pagamento recusado!' : 'Acerto excluído com sucesso!');
      await Promise.all([loadSettlements(), loadBalances(), loadStats()]);
    } catch (err: unknown) {
      if (await checkAndResetIdentityOn404(err)) return;
      const msg = err instanceof ApiError ? err.message : 'Falha ao excluir acerto.';
      setSettlementDeleteError(msg);
    } finally {
      setIsDeletingSettlement(false);
    }
  };

  // Handlers for Pix for Creditor
  const handleGenerateCreditorPix = async (st: SuggestedTransferDto) => {
    if (!termsAccepted) {
      toast.error('Aceite os Termos de Uso e a Política de Privacidade para gerar o Pix.');
      return;
    }
    try {
      setCreditorPixLoading(true);
      setCreditorPixError(null);
      const pix = await api.getMemberPix(groupId, st.toMemberId, st.amount);
      setCreditorPixTransfer(st);
      setCreditorPixPaid(false);
      setCreditorPixData(pix);
    } catch (err: unknown) {
      if (await checkAndResetIdentityOn404(err)) return;
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Não foi possível gerar o Pix. Verifique se o membro possui chave Pix cadastrada.';
      setCreditorPixError(msg);
    } finally {
      setCreditorPixLoading(false);
    }
  };

  const handleMarkCreditorPixPaid = async () => {
    if (!creditorPixTransfer) return;
    try {
      setCreditorPixMarkingPaid(true);
      await api.createSettlement(groupId, {
        fromMemberId: creditorPixTransfer.fromMemberId,
        toMemberId: creditorPixTransfer.toMemberId,
        amount: creditorPixTransfer.amount,
        date: isoDay(new Date()),
        notes: null,
      });
      setCreditorPixPaid(true);
      toast.success('Pagamento registrado (aguardando confirmação do recebedor)');
      await Promise.all([loadSettlements(), loadBalances(), loadStats()]);
    } catch (err: unknown) {
      if (await checkAndResetIdentityOn404(err)) return;
      const msg = err instanceof ApiError ? err.message : 'Erro ao registrar pagamento.';
      toast.error(msg);
    } finally {
      setCreditorPixMarkingPaid(false);
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
      await Promise.all([loadGroup(), loadExpenses(), loadBalances(), loadSettlements(), loadStats()]);
    } catch (err: unknown) {
      if (await checkAndResetIdentityOn404(err)) return;
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
      await Promise.all([loadGroup(), loadBalances(), loadStats()]);
    } catch (err: unknown) {
      if (await checkAndResetIdentityOn404(err)) return;
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

  const handleResetMemberClaim = async (memberId: string) => {
    try {
      setIsResettingClaim(true);
      await api.resetMemberClaim(groupId, memberId);
      setResettingMemberId(null);
      toast.success('Acesso do membro liberado!');
      await loadGroup();
    } catch (err: unknown) {
      if (await checkAndResetIdentityOn404(err)) return;
      toast.error(err instanceof ApiError ? err.message : 'Erro ao liberar acesso.');
    } finally {
      setIsResettingClaim(false);
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
      saveGroup({
        id: updated.id,
        name: updated.name,
        accessToken: updated.accessToken ?? undefined,
        adminToken: updated.adminToken ?? undefined,
      });
      setGroupSettingsModalOpen(false);
    } catch (err: unknown) {
      if (await checkAndResetIdentityOn404(err)) return;
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
      if (await checkAndResetIdentityOn404(err)) return;
      setGroupDeleteError(err instanceof ApiError ? err.message : 'Erro ao excluir grupo.');
      setIsDeletingGroup(false);
    }
  };

  if (loading && !group) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 lg:pt-4 pb-28 lg:pb-12 w-full space-y-4 animate-fade-up" aria-busy="true">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center animate-fade-up">
        <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/30 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-50 mb-2">
          Grupo não encontrado
        </h1>
        <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
          {error ?? 'Esse grupo não existe ou o link não tem permissão de acesso.'}
        </p>
        <Link
          href="/despesas"
          className="inline-flex items-center justify-center h-11 sm:h-12 px-5 bg-accent text-accent-fg rounded-xl text-sm font-semibold hover:bg-accent-hover active:scale-[0.98] transition-all shadow-sm"
        >
          Voltar para grupos
        </Link>
      </div>
    );
  }

  // Gate de Identidade: se não escolheu identidade, mostra o IdentityPicker
  if (!group.yourMemberId) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 lg:pt-4 pb-28 lg:pb-12 w-full animate-fade-up">
        <Link
          href="/despesas"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-50 transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Grupos
        </Link>
        <IdentityPicker
          groupName={group.name}
          members={group.members}
          onClaim={handleClaim}
        />
      </div>
    );
  }

  const heroTotal = stats?.totalSpent ?? expenses.reduce((acc, e) => acc + e.amount, 0);
  const pendingSettlementsCount = settlements.filter((s) => s.status === 'Pending').length;
  const editingExp = editingExpenseId ? expenses.find((e) => e.id === editingExpenseId) : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 lg:pt-4 pb-28 lg:pb-12 w-full space-y-6 lg:space-y-6 animate-fade-up">
      {/* Top Breadcrumb & Header */}
      <div className="space-y-4">
        <div>
          <Link
            href="/despesas"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-50 transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Grupos
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-2xl font-semibold tracking-tight text-zinc-50">
                {group.name}
              </h1>
              {group.description && (
                <p className="text-sm text-zinc-400 mt-1 max-w-xl leading-relaxed">
                  {group.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setIsInviteOpen((prev) => !prev)}
                aria-expanded={isInviteOpen}
                className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 text-sm font-semibold transition active:scale-[0.98] cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-accent" />
                <span>Convidar</span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setGroupSettingsModalOpen(true)}
                  aria-label="Configurações do grupo"
                  className="inline-flex items-center justify-center w-11 h-11 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-50 active:scale-[0.98] transition cursor-pointer"
                  title="Configurações do grupo"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}

              {canWrite && (
                <button
                  type="button"
                  onClick={handleOpenNewExpense}
                  className="fixed right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 sm:static inline-flex items-center justify-center gap-2 h-11 sm:h-12 px-4 sm:px-5 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg font-semibold text-sm sm:text-[15px] active:scale-[0.98] transition-all cursor-pointer shadow-lg sm:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Nova Despesa</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Painel de Convite Recolhível */}
        {isInviteOpen && (
          <InvitePanel
            groupId={group.id}
            inviteToken={group.accessToken ?? getGroupCredentials(group.id)?.accessToken}
            adminToken={group.adminToken}
            isAdmin={isAdmin}
            onRotate={isAdmin ? handleRotateInvite : undefined}
            variant="card"
          />
        )}

        {/* Hero Summary Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
          <div>
            <span className="text-[13px] font-medium text-zinc-400">Total acumulado</span>
            <div className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-50 mt-0.5 tabular-nums">
              <Money value={heroTotal} animate />
            </div>
          </div>
          <div className="text-xs sm:text-sm text-zinc-400">
            <span className="font-semibold text-zinc-200">{expenses.length}</span> {expenses.length === 1 ? 'despesa' : 'despesas'} · <span className="font-semibold text-zinc-200">{group.members.length}</span> {group.members.length === 1 ? 'membro' : 'membros'}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center p-1 rounded-xl bg-zinc-950/60 border border-zinc-800/80 overflow-x-auto gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          className={`h-10 px-3.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer flex-1 sm:flex-initial text-center ${
            activeTab === 'expenses'
              ? 'bg-zinc-800 text-accent font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
          }`}
        >
          Extrato ({expenses.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('balances')}
          className={`h-10 px-3.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer flex-1 sm:flex-initial text-center ${
            activeTab === 'balances'
              ? 'bg-zinc-800 text-accent font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
          }`}
        >
          Saldos
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settlements')}
          className={`h-10 px-3.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer flex-1 sm:flex-initial text-center ${
            activeTab === 'settlements'
              ? 'bg-zinc-800 text-accent font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
          }`}
        >
          Pagamentos ({settlements.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('stats')}
          className={`h-10 px-3.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer flex-1 sm:flex-initial text-center ${
            activeTab === 'stats'
              ? 'bg-zinc-800 text-accent font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
          }`}
        >
          Resumo
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`h-10 px-3.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer flex-1 sm:flex-initial text-center ${
            activeTab === 'members'
              ? 'bg-zinc-800 text-accent font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
          }`}
        >
          Membros ({group.members.length})
        </button>
      </div>

      {/* Tab 1: Despesas */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="p-3 sm:p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 text-xs">
            <div>
              <input
                type="date"
                value={filterFrom}
                max={filterTo || undefined}
                onChange={(e) => setFilterFrom(e.target.value)}
                placeholder="De"
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-50 text-base md:text-sm focus:border-accent focus:outline-none transition-colors"
              />
            </div>

            <div>
              <input
                type="date"
                value={filterTo}
                min={filterFrom || undefined}
                onChange={(e) => setFilterTo(e.target.value)}
                placeholder="Até"
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-50 text-base md:text-sm focus:border-accent focus:outline-none transition-colors"
              />
            </div>

            <div>
              <Select
                value={filterCategory}
                onChange={(value) => setFilterCategory(value)}
                options={[{ value: '', label: 'Todas Categorias' }, ...CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))]}
                triggerClassName="px-3 py-1.5 h-11 rounded-xl text-sm"
                className="block sm:inline-block w-full sm:w-auto"
              />
            </div>

            <div>
              <Select
                value={filterMemberId}
                onChange={(value) => setFilterMemberId(value)}
                options={[{ value: '', label: 'Todos Quem Pagou' }, ...group.members.map((mb) => ({ value: mb.id, label: mb.name }))]}
                triggerClassName="px-3 py-1.5 h-11 rounded-xl text-sm"
                className="block sm:inline-block w-full sm:w-auto"
              />
            </div>

            {(filterFrom || filterTo || filterCategory || filterMemberId) && (
              <button
                type="button"
                onClick={() => {
                  setFilterFrom('');
                  setFilterTo('');
                  setFilterCategory('');
                  setFilterMemberId('');
                }}
                className="col-span-2 h-11 px-3 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-xs font-semibold text-accent transition-all active:scale-[0.98] cursor-pointer sm:ml-auto inline-flex items-center justify-center"
              >
                Limpar Filtros
              </button>
            )}
          </div>

          {/* Expenses List */}
          {expenses.length === 0 ? (
            <div className="p-8 sm:p-12 text-center flex flex-col items-center max-w-sm mx-auto rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300 mb-4 shadow-sm">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-zinc-50 text-base">
                Nenhuma despesa encontrada
              </h3>
              <p className="text-sm text-zinc-400 mt-1">
                {canWrite
                  ? 'Use "Nova Despesa" para registrar um gasto.'
                  : 'Nenhuma despesa registrada neste grupo ainda.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupByDay(expenses).map((g) => (
                <div key={g.key} className="space-y-2">
                  <DayHeader label={g.label} />
                  <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 divide-y divide-zinc-800/80 overflow-hidden">
                    {g.items.map((exp) => {
                      const Icon = (CATEGORY_STYLE[exp.category] ?? CATEGORY_STYLE.Other).icon;
                      const catCls = (CATEGORY_STYLE[exp.category] ?? CATEGORY_STYLE.Other).cls;
                      const status = getExpenseStatus(exp);
                      const canManageExpense = isAdmin || (!!me && exp.createdByMemberId === me);
                      const isConfirmer =
                        !!me &&
                        exp.shares.some((s) => s.memberId === me) &&
                        exp.paidByMemberId !== me;
                      const myConf = isConfirmer
                        ? exp.confirmations.find((c) => c.memberId === me)
                        : null;

                      return (
                        <div
                          key={exp.id}
                          className="p-3.5 sm:p-4 hover:bg-zinc-900/60 transition-colors"
                        >
                          <div className="flex items-center gap-3.5">
                            <span
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${catCls}`}
                              title={CATEGORY_LABELS[exp.category]}
                            >
                              <Icon className="w-5 h-5" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-zinc-50 text-sm truncate">
                                  {exp.description}
                                </p>
                                {status && (
                                  <span title={status.title} className="shrink-0">
                                    <StatusPill tone={status.tone}>{status.label}</StatusPill>
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-zinc-400 mt-0.5 truncate">
                                Pago por <span className="text-zinc-300 font-medium">{exp.paidByName}</span>
                                {exp.createdByName ? ` · por ${exp.createdByName}` : ''}
                                {exp.updatedByName ? ` (editado por ${exp.updatedByName})` : ''}
                                {exp.notes ? ` · ${exp.notes}` : ''}
                              </p>
                            </div>
                            <div className="text-right shrink-0 text-base sm:text-lg font-bold tabular-nums text-zinc-50">
                              <Money value={exp.amount} />
                            </div>
                            {canManageExpense && (
                              <div className="flex items-center shrink-0 gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleEditExpense(exp)}
                                  aria-label="Editar despesa"
                                  className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors cursor-pointer"
                                  title="Editar despesa"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteExpense(exp)}
                                  aria-label="Excluir despesa"
                                  className="p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                  title="Excluir despesa"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Seção Confirmar / Contestar para confirmador */}
                          {isConfirmer && (
                            <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex flex-wrap items-center gap-2">
                              <span className="text-[11px] text-zinc-400">Sua confirmação:</span>
                              <button
                                type="button"
                                onClick={() => handleConfirmExpense(exp.id, 'Confirmed')}
                                disabled={confirmingExpenseId === exp.id || myConf?.status === 'Confirmed'}
                                className={`h-7 px-2.5 rounded-lg text-xs font-medium transition cursor-pointer inline-flex items-center gap-1 ${
                                  myConf?.status === 'Confirmed'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5" />
                                {myConf?.status === 'Confirmed' ? 'Confirmada' : 'Confirmar'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setContestTarget(exp);
                                  setContestComment(myConf?.comment || '');
                                }}
                                disabled={confirmingExpenseId === exp.id}
                                className={`h-7 px-2.5 rounded-lg text-xs font-medium transition cursor-pointer inline-flex items-center gap-1 ${
                                  myConf?.status === 'Contested'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60'
                                }`}
                              >
                                {myConf?.status === 'Contested' ? 'Contestada' : 'Contestar'}
                              </button>
                              {myConf?.comment && (
                                <span className="text-[11px] text-zinc-400 italic truncate max-w-xs" title={myConf.comment}>
                                  &quot;{myConf.comment}&quot;
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Saldos */}
      {activeTab === 'balances' && balances && (
        <div className="space-y-8">
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-zinc-50 tracking-tight">Saldos</h2>
              {pendingSettlementsCount > 0 && (
                <p className="text-xs text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {pendingSettlementsCount === 1
                      ? '1 acerto aguardando confirmação não entra no saldo.'
                      : `${pendingSettlementsCount} acertos aguardando confirmação não entram no saldo.`}
                  </span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {balances.members.map((m) => {
                const isPositive = m.net > 0.005;
                const isNegative = m.net < -0.005;

                return (
                  <div
                    key={m.memberId}
                    className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 flex flex-col justify-between gap-4 shadow-sm hover:border-zinc-700/80 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-zinc-50 text-base truncate">{m.name}</span>
                        {m.memberId === me && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-accent/15 text-accent border border-accent/25 shrink-0">
                            Você
                          </span>
                        )}
                      </div>
                      {isPositive ? (
                        <StatusPill tone="emerald">A receber</StatusPill>
                      ) : isNegative ? (
                        <StatusPill tone="amber">Pendente</StatusPill>
                      ) : (
                        <StatusPill tone="emerald">Quitado</StatusPill>
                      )}
                    </div>

                    <div className="text-2xl sm:text-3xl font-bold tabular-nums">
                      <span
                        className={
                          isPositive
                            ? 'text-emerald-400'
                            : isNegative
                            ? 'text-rose-400'
                            : 'text-zinc-400'
                        }
                      >
                        <Money value={Math.abs(m.net)} />
                      </span>
                    </div>

                    <div className="pt-3 border-t border-zinc-800/80 text-xs text-zinc-400 space-y-1">
                      <p>
                        Pagou <span className="text-zinc-200 font-medium">{formatBRL(m.paid)}</span> · Parte devida{' '}
                        <span className="text-zinc-200 font-medium">{formatBRL(m.owed)}</span>
                      </p>
                      {(m.settlementsSent > 0 || m.settlementsReceived > 0) && (
                        <p className="text-zinc-400">
                          Pagamentos +{formatBRL(m.settlementsSent)} / -{formatBRL(m.settlementsReceived)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-4 pt-4">
            <h2 className="text-lg font-semibold text-zinc-50 tracking-tight">Transferências sugeridas</h2>

            {creditorPixError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{creditorPixError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCreditorPixError(null)}
                  className="font-semibold underline hover:opacity-80 cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            )}

            {balances.suggestedTransfers.length === 0 ? (
              <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 text-center text-sm text-zinc-400">
                Quitado. Nenhuma transferência pendente no grupo.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2.5">
                  <TermsShortNotice />
                  <TermsConsentCheckbox id="group-settle-terms-consent" />
                </div>

                {balances.suggestedTransfers.map((st, idx) => {
                  const canSettle = isAdmin || (!!me && (st.fromMemberId === me || st.toMemberId === me));

                  return (
                    <div
                      key={idx}
                      className="p-4 sm:p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="text-sm text-zinc-300">
                        <strong className="font-semibold text-zinc-50">{st.fromName}</strong>{' '}
                        deve pagar{' '}
                        <span className="font-bold text-amber-400 tabular-nums"><Money value={st.amount} /></span>{' '}
                        para <strong className="font-semibold text-zinc-50">{st.toName}</strong>
                      </div>

                      {canSettle && (
                        <div className="grid grid-cols-2 sm:flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleGenerateCreditorPix(st)}
                            disabled={creditorPixLoading || !termsAccepted}
                            className="h-11 px-4 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 text-sm font-semibold transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                          >
                            <QrCode className="w-4 h-4 text-accent" />
                            Gerar Pix QR
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenSettlement(st.fromMemberId, st.toMemberId, st.amount)}
                            className="h-11 px-4 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg text-sm font-semibold transition active:scale-[0.98] cursor-pointer shadow-sm text-center flex items-center justify-center"
                          >
                            Registrar pagamento
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Tab 3: Acertos */}
      {activeTab === 'settlements' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center gap-3">
            <h2 className="text-lg font-semibold text-zinc-50 tracking-tight">
              Pagamentos
            </h2>
            {canWrite && (
              <button
                type="button"
                onClick={() => handleOpenSettlement()}
                className="h-11 px-4 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg text-sm font-semibold flex items-center gap-2 active:scale-[0.98] transition cursor-pointer shrink-0 shadow-sm"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" /> Registrar pagamento
              </button>
            )}
          </div>

          {settlements.length === 0 ? (
            <div className="p-8 sm:p-12 text-center flex flex-col items-center max-w-sm mx-auto rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300 mb-4 shadow-sm">
                <ArrowLeftRight className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-zinc-50 text-base">
                Nenhum pagamento registrado
              </h3>
              <p className="text-sm text-zinc-400 mt-1">
                Registre aqui as transferências feitas entre membros.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupByDay(settlements).map((g) => (
                <div key={g.key} className="space-y-2">
                  <DayHeader label={g.label} />
                  <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 divide-y divide-zinc-800/80 overflow-hidden">
                    {g.items.map((st) => {
                      const isReceiver = !!me && me === st.toMemberId;
                      const isPending = st.status === 'Pending';
                      const canConfirmReceipt = isPending && (isAdmin || isReceiver);
                      const isReceiverPending = isPending && isReceiver;
                      const canDeleteSettlement =
                        isAdmin || (!!me && st.createdByMemberId === me) || isReceiverPending;

                      return (
                        <div
                          key={st.id}
                          className="p-3.5 sm:p-4 hover:bg-zinc-900/60 transition-colors flex items-center gap-3.5"
                        >
                          <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 flex items-center justify-center shrink-0">
                            <ArrowLeftRight className="w-5 h-5 text-accent" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-zinc-50 text-sm truncate">
                                {st.fromName} para {st.toName}
                              </p>
                              {isPending && (
                                <StatusPill tone="amber">Aguardando confirmação</StatusPill>
                              )}
                            </div>
                            <p className="text-xs text-zinc-400 mt-0.5 truncate">
                              {st.createdByName ? `Registrado por ${st.createdByName}` : ''}
                              {st.notes ? ` · ${st.notes}` : ''}
                            </p>
                          </div>
                          <div className="text-right shrink-0 text-base sm:text-lg font-bold tabular-nums text-zinc-50">
                            <Money value={st.amount} />
                          </div>
                          <div className="flex items-center shrink-0 gap-1.5">
                            {canConfirmReceipt && (
                              <button
                                type="button"
                                onClick={() => handleConfirmSettlement(st.id)}
                                disabled={confirmingSettlementId === st.id}
                                className="h-8 px-2.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Confirmar recebimento</span>
                                <span className="sm:hidden">Confirmar</span>
                              </button>
                            )}
                            {canDeleteSettlement && (
                              isReceiverPending ? (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSettlement(st)}
                                  className="h-8 px-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-1 transition active:scale-[0.98] cursor-pointer"
                                >
                                  Recusar
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSettlement(st)}
                                  aria-label="Excluir acerto"
                                  className="p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                                  title="Excluir acerto"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="p-5 sm:p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 shadow-sm">
              <p className="text-[13px] font-medium text-zinc-400">Total gasto no período</p>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-50 mt-1 tabular-nums">
                <Money value={stats.totalSpent} />
              </p>
            </div>
            <div className="p-5 sm:p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 shadow-sm">
              <p className="text-[13px] font-medium text-zinc-400">Média por membro</p>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-50 mt-1 tabular-nums">
                <Money value={group.members.length > 0 ? stats.totalSpent / group.members.length : 0} />
              </p>
            </div>
          </div>

          <StatsCharts stats={stats} />
        </div>
      )}

      {/* Tab 5: Membros */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center gap-3">
            <h2 className="text-lg font-semibold text-zinc-50 tracking-tight">
              Membros do Grupo ({group.members.length})
            </h2>
            {canWrite && (
              <button
                type="button"
                onClick={() => handleOpenMemberModal()}
                className="h-11 px-4 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg text-sm font-semibold flex items-center gap-2 active:scale-[0.98] transition cursor-pointer shrink-0 shadow-sm"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" /> Adicionar Membro
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {group.members.map((m) => {
              const canEditMember = isAdmin || (!!me && m.id === me);

              return (
                <div
                  key={m.id}
                  className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex flex-col justify-between space-y-4 hover:border-zinc-700/80 transition-colors shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/15 text-accent border border-accent/30 font-semibold flex items-center justify-center text-sm shrink-0">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-semibold text-zinc-50 text-base truncate">
                            {m.name}
                          </h3>
                          {m.id === me && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-accent/15 text-accent border border-accent/25">
                              Você
                            </span>
                          )}
                          {m.isAdmin && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                              Admin
                            </span>
                          )}
                        </div>
                        {m.pixKey ? (
                          <p className="text-xs text-zinc-400 font-mono break-all mt-0.5">
                            Pix: {m.pixKey} ({m.pixKeyType ? PIX_KEY_TYPE_LABELS[m.pixKeyType] : ''})
                          </p>
                        ) : (
                          <p className="text-xs text-zinc-400 italic mt-0.5">Sem Pix cadastrado</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-zinc-800/80">
                    {resettingMemberId === m.id ? (
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-zinc-400">Liberar acesso deste membro?</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={isResettingClaim}
                            onClick={() => handleResetMemberClaim(m.id)}
                            className="h-8 px-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-xs transition cursor-pointer disabled:opacity-50"
                          >
                            {isResettingClaim ? 'Liberando...' : 'Confirmar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setResettingMemberId(null)}
                            className="h-8 px-2.5 rounded-lg text-zinc-400 hover:text-zinc-200 text-xs transition cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        {isAdmin && m.claimed && m.id !== me && (
                          <button
                            type="button"
                            onClick={() => setResettingMemberId(m.id)}
                            className="h-9 px-3 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-50 transition active:scale-[0.98] text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                            title="Permite que outra pessoa ou aparelho reivindique este membro"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Liberar acesso
                          </button>
                        )}
                        {canEditMember && (
                          <button
                            type="button"
                            onClick={() => handleOpenMemberModal(m)}
                            className="h-9 px-3 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 hover:text-zinc-50 transition active:scale-[0.98] text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Editar
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              setMemberToDelete(m);
                              setMemberDeleteError(null);
                            }}
                            className="h-9 px-3 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 transition active:scale-[0.98] text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remover
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
            <div
              role="alert"
              className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{expenseFormError}</span>
            </div>
          )}

          {editingExp && (editingExp.createdByName || editingExp.updatedByName) && (
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-400">
              {editingExp.createdByName && (
                <span>Criada por <strong className="text-zinc-200">{editingExp.createdByName}</strong></span>
              )}
              {editingExp.updatedByName && (
                <span> · Editada por <strong className="text-zinc-200">{editingExp.updatedByName}</strong></span>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label htmlFor="expense-desc" className="block text-[13px] font-medium text-zinc-400 mb-1.5">
                Descrição *
              </label>
              <input
                id="expense-desc"
                type="text"
                required
                placeholder="Ex: Compras no Supermercado, Aluguel, Combustível"
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-50 text-base md:text-sm placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="expense-amount" className="block text-[13px] font-medium text-zinc-400 mb-1.5">
                Valor Total (R$) *
              </label>
              <input
                id="expense-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={expenseAmountStr}
                onChange={(e) => setExpenseAmountStr(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-50 text-base md:text-sm font-semibold tabular-nums placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="expense-date" className="block text-[13px] font-medium text-zinc-400 mb-1.5">
                Data *
              </label>
              <input
                id="expense-date"
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-50 text-base md:text-sm focus:border-accent focus:outline-none transition-colors"
              />
            </div>

            <div>
              <span className="block text-[13px] font-medium text-zinc-400 mb-1.5">
                Categoria *
              </span>
              <Select
                value={expenseCategory}
                onChange={(value) => setExpenseCategory(value as ExpenseCategory)}
                options={CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
                triggerClassName="px-3.5 py-2 h-11 rounded-xl text-sm"
              />
            </div>

            <div>
              <span className="block text-[13px] font-medium text-zinc-400 mb-1.5">
                Quem Pagou? *
              </span>
              <Select
                value={expensePaidBy}
                onChange={(value) => setExpensePaidBy(value)}
                options={group.members.map((mb) => ({ value: mb.id, label: mb.name }))}
                triggerClassName="px-3.5 py-2 h-11 rounded-xl text-sm font-medium"
              />
            </div>
          </div>

          {/* Division Mode */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-zinc-400">
                Divisão entre Membros *
              </span>
              <div className="inline-flex p-1 rounded-xl bg-zinc-950/60 border border-zinc-800/80 gap-1">
                {(['Equal', 'Custom', 'Percentage'] as ShareMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setExpenseShareMode(mode)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      expenseShareMode === mode
                        ? 'bg-zinc-800 text-accent font-semibold shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
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
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs"
                  >
                    <label className="flex items-center gap-2 cursor-pointer select-none">
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
                          className="w-3.5 h-3.5 rounded accent-[var(--accent)] cursor-pointer"
                        />
                      )}
                      <span className="font-medium text-zinc-200">
                        {member.name}
                      </span>
                    </label>

                    {expenseShareMode === 'Custom' && (
                      <div className="flex items-center gap-1.5 w-32">
                        <span className="text-zinc-500 font-medium">R$</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min="0"
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
                          className="w-full h-8 px-2 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-50 text-right font-semibold tabular-nums focus:border-accent focus:outline-none"
                        />
                      </div>
                    )}

                    {expenseShareMode === 'Percentage' && (
                      <div className="flex items-center gap-1.5 w-24">
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min="0"
                          max="100"
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
                          className="w-full h-8 px-2 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-50 text-right font-semibold tabular-nums focus:border-accent focus:outline-none"
                        />
                        <span className="text-zinc-500 font-medium">%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="expense-notes" className="block text-[13px] font-medium text-zinc-400 mb-1.5">
              Observações (opcional)
            </label>
            <input
              id="expense-notes"
              type="text"
              placeholder="Ex: Compra parcelada, cupom aplicado..."
              value={expenseNotes}
              onChange={(e) => setExpenseNotes(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-50 text-base md:text-sm placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={() => setExpenseModalOpen(false)}
              className="h-11 px-4 rounded-xl border border-zinc-800 text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800/60 font-semibold text-sm transition-colors active:scale-[0.98] cursor-pointer inline-flex items-center justify-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingExpense}
              className="h-11 px-5 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg font-semibold text-sm transition-all active:scale-[0.98] shadow-sm cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {savingExpense ? 'Salvando...' : 'Salvar Despesa'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Contestar Despesa */}
      <Modal
        isOpen={!!contestTarget}
        onClose={() => {
          setContestTarget(null);
          setContestComment('');
        }}
        title="Contestar Despesa"
        description={
          contestTarget
            ? `Contestar o valor ou divisão de "${contestTarget.description}".`
            : undefined
        }
        maxWidth="md"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!contestTarget) return;
            setSavingContest(true);
            try {
              await handleConfirmExpense(contestTarget.id, 'Contested', contestComment.trim() || null);
              setContestTarget(null);
              setContestComment('');
            } finally {
              setSavingContest(false);
            }
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="contest-comment-input" className="block text-[13px] font-medium text-zinc-400 mb-1.5">
              Motivo da contestação (opcional)
            </label>
            <textarea
              id="contest-comment-input"
              maxLength={200}
              rows={3}
              value={contestComment}
              onChange={(e) => setContestComment(e.target.value)}
              placeholder="Ex: Não consumi esse item ou a divisão de valores está incorreta"
              className="w-full p-3.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-50 text-sm placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors resize-none"
            />
            <span className="block text-right text-xs text-zinc-500 mt-1">
              {contestComment.length}/200 caracteres
            </span>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={() => {
                setContestTarget(null);
                setContestComment('');
              }}
              className="h-11 px-4 rounded-xl border border-zinc-800 text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800/60 font-semibold text-sm transition-colors active:scale-[0.98] cursor-pointer inline-flex items-center justify-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingContest}
              className="h-11 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold text-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 inline-flex items-center justify-center"
            >
              {savingContest ? 'Enviando...' : 'Confirmar Contestação'}
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
            <div
              role="alert"
              className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{settlementError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="block text-[13px] font-medium text-zinc-400 mb-1.5">
                Quem Pagou (Devedor) *
              </span>
              <Select
                value={settlementFrom}
                onChange={(value) => {
                  setSettlementFrom(value);
                  if (!isAdmin && me && value !== me) {
                    setSettlementTo(me);
                  }
                }}
                options={group.members
                  .filter((mb) => isAdmin || !me || settlementTo === me || mb.id === me)
                  .map((mb) => ({ value: mb.id, label: mb.name }))}
                triggerClassName="px-3.5 py-2 h-11 rounded-xl text-sm"
              />
            </div>

            <div>
              <span className="block text-[13px] font-medium text-zinc-400 mb-1.5">
                Quem Recebeu (Credor) *
              </span>
              <Select
                value={settlementTo}
                onChange={(value) => {
                  setSettlementTo(value);
                  if (!isAdmin && me && value !== me) {
                    setSettlementFrom(me);
                  }
                }}
                options={group.members
                  .filter((mb) => isAdmin || !me || settlementFrom === me || mb.id === me)
                  .map((mb) => ({ value: mb.id, label: mb.name }))}
                triggerClassName="px-3.5 py-2 h-11 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="settlement-amount" className="block text-[13px] font-medium text-zinc-400 mb-1.5">
                Valor (R$) *
              </label>
              <input
                id="settlement-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={settlementAmountStr}
                onChange={(e) => setSettlementAmountStr(e.target.value)}
                className="w-full h-11 px-3.5 py-2 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-50 text-base md:text-sm font-semibold tabular-nums placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="settlement-date" className="block text-[13px] font-medium text-zinc-400 mb-1.5">
                Data *
              </label>
              <input
                id="settlement-date"
                type="date"
                required
                value={settlementDate}
                onChange={(e) => setSettlementDate(e.target.value)}
                className="w-full h-11 px-3.5 py-2 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-50 text-base md:text-sm focus:border-accent focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="settlement-notes" className="block text-[13px] font-medium text-zinc-400 mb-1.5">
              Observações (opcional)
            </label>
            <input
              id="settlement-notes"
              type="text"
              placeholder="Ex: Pix comprovante enviado no WhatsApp"
              value={settlementNotes}
              onChange={(e) => setSettlementNotes(e.target.value)}
              className="w-full h-11 px-3.5 py-2 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-50 text-base md:text-sm placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={() => setSettlementModalOpen(false)}
              className="h-11 px-4 rounded-xl border border-zinc-800 text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800/60 font-semibold text-sm transition-colors active:scale-[0.98] cursor-pointer inline-flex items-center justify-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingSettlement}
              className="h-11 px-5 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg font-semibold text-sm transition-all active:scale-[0.98] shadow-sm cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
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
            <div
              role="alert"
              className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{memberError}</span>
            </div>
          )}

          <div>
            <label htmlFor="member-name" className="block text-[13px] font-medium text-zinc-400 mb-1.5">
              Nome do Membro *
            </label>
            <input
              id="member-name"
              type="text"
              required
              placeholder="Ex: João, Maria, Pedro"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              className="w-full h-11 px-3.5 py-2 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-50 text-base md:text-sm placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <span className="block text-[13px] font-medium text-zinc-400 mb-1.5">
                Tipo Pix
              </span>
              <Select
                value={memberPixKeyType}
                onChange={(value) => {
                  const nextType = value as PixKeyType;
                  setMemberPixKeyType(nextType);
                  setMemberPixKey((current) => maskPixKey(current, nextType));
                }}
                options={PIX_KEY_TYPE_OPTIONS}
                triggerClassName="px-2.5 py-2 h-11 rounded-xl text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="member-pix-key" className="block text-[13px] font-medium text-zinc-400 mb-1.5">
                Chave Pix (opcional)
              </label>
              <input
                id="member-pix-key"
                type="text"
                inputMode={memberPixKeyType === 'Email' || memberPixKeyType === 'Random' ? 'text' : 'numeric'}
                placeholder={PIX_KEY_PLACEHOLDERS[memberPixKeyType]}
                value={memberPixKey}
                onChange={(e) => setMemberPixKey(maskPixKey(e.target.value, memberPixKeyType))}
                className="w-full h-11 px-3.5 py-2 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-50 text-base md:text-sm font-mono placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={() => setMemberModalOpen(false)}
              className="h-11 px-4 rounded-xl border border-zinc-800 text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800/60 font-semibold text-sm transition-colors active:scale-[0.98] cursor-pointer inline-flex items-center justify-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingMember}
              className="h-11 px-5 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg font-semibold text-sm transition-all active:scale-[0.98] shadow-sm cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
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
            <div
              role="alert"
              className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{memberDeleteError}</span>
            </div>
          )}

          <p className="text-sm text-zinc-300 leading-relaxed">
            Deseja realmente remover <strong>{memberToDelete?.name}</strong> do grupo?
          </p>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={() => {
                setMemberToDelete(null);
                setMemberDeleteError(null);
              }}
              className="h-11 px-4 rounded-xl border border-zinc-800 text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800/60 font-semibold text-sm transition-colors active:scale-[0.98] cursor-pointer inline-flex items-center justify-center"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isDeletingMember}
              onClick={handleConfirmDeleteMember}
              className="h-11 px-5 rounded-xl border border-rose-500/40 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold text-sm transition-colors active:scale-[0.98] cursor-pointer disabled:opacity-50 inline-flex items-center justify-center shadow-sm"
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
          onClose={() => {
            setCreditorPixData(null);
            setCreditorPixTransfer(null);
            setCreditorPixPaid(false);
          }}
          title={`Pagar ${creditorPixData.name} via Pix`}
          receiverName={creditorPixData.name}
          amount={creditorPixData.amount}
          pixCode={creditorPixData.pixCode}
          pixKey={creditorPixData.pixKey}
          onMarkPaid={handleMarkCreditorPixPaid}
          isMarkingPaid={creditorPixMarkingPaid}
          isPaid={creditorPixPaid}
          payerName={creditorPixTransfer?.fromName}
          splitTitle={group.name}
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
            <div
              role="alert"
              className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{groupSettingsError}</span>
            </div>
          )}

          <form onSubmit={handleSaveGroupSettings} className="space-y-4">
            <div>
              <label htmlFor="edit-group-name" className="block text-[13px] font-medium text-zinc-400 mb-1.5">
                Nome do Grupo
              </label>
              <input
                id="edit-group-name"
                type="text"
                required
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-50 text-base md:text-sm placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="edit-group-desc" className="block text-[13px] font-medium text-zinc-400 mb-1.5">
                Descrição
              </label>
              <input
                id="edit-group-desc"
                type="text"
                value={editGroupDesc}
                onChange={(e) => setEditGroupDesc(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-50 text-base md:text-sm placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors"
              />
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="submit"
                disabled={savingGroupSettings}
                className="h-11 px-5 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg font-semibold text-sm transition-all active:scale-[0.98] shadow-sm cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {savingGroupSettings ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>

          <div className="pt-4 border-t border-zinc-800/80 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-400">
              Zona de Perigo
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Excluir este grupo apagará todas as despesas, acertos e registros para sempre.
            </p>
            <button
              type="button"
              onClick={() => {
                setGroupSettingsModalOpen(false);
                setGroupDeleteError(null);
                setGroupDeleteConfirmOpen(true);
              }}
              className="h-11 px-4 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-sm transition-colors active:scale-[0.98] cursor-pointer inline-flex items-center justify-center"
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
            <div
              role="alert"
              className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{expenseDeleteError}</span>
            </div>
          )}

          <p className="text-sm text-zinc-300 leading-relaxed">
            Deseja realmente excluir a despesa <strong>{expenseToDelete?.description}</strong> no valor de <strong>{expenseToDelete ? formatBRL(expenseToDelete.amount) : ''}</strong>?
          </p>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={() => {
                setExpenseToDelete(null);
                setExpenseDeleteError(null);
              }}
              className="h-11 px-4 rounded-xl border border-zinc-800 text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800/60 font-semibold text-sm transition-colors active:scale-[0.98] cursor-pointer inline-flex items-center justify-center"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isDeletingExpense}
              onClick={handleConfirmDeleteExpense}
              className="h-11 px-5 rounded-xl border border-rose-500/40 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold text-sm transition-colors active:scale-[0.98] cursor-pointer disabled:opacity-50 inline-flex items-center justify-center shadow-sm"
            >
              {isDeletingExpense ? 'Excluindo...' : 'Confirmar Exclusão'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Confirmar Remoção / Recusa de Acerto */}
      <Modal
        isOpen={!!settlementToDelete}
        onClose={() => {
          setSettlementToDelete(null);
          setSettlementDeleteError(null);
        }}
        title={
          settlementToDelete?.status === 'Pending' && me === settlementToDelete?.toMemberId
            ? 'Recusar Pagamento'
            : 'Excluir Registro de Acerto'
        }
        maxWidth="md"
      >
        <div className="space-y-4">
          {settlementDeleteError && (
            <div
              role="alert"
              className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{settlementDeleteError}</span>
            </div>
          )}

          <p className="text-sm text-zinc-300 leading-relaxed">
            {settlementToDelete?.status === 'Pending' && me === settlementToDelete?.toMemberId ? (
              <>
                Deseja recusar o pagamento de{' '}
                <strong>{settlementToDelete ? formatBRL(settlementToDelete.amount) : ''}</strong> feito por{' '}
                <strong>{settlementToDelete?.fromName}</strong>?
              </>
            ) : (
              <>
                Deseja realmente excluir o acerto de{' '}
                <strong>{settlementToDelete ? formatBRL(settlementToDelete.amount) : ''}</strong> pago por{' '}
                <strong>{settlementToDelete?.fromName}</strong> para{' '}
                <strong>{settlementToDelete?.toName}</strong>?
              </>
            )}
          </p>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={() => {
                setSettlementToDelete(null);
                setSettlementDeleteError(null);
              }}
              className="h-11 px-4 rounded-xl border border-zinc-800 text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800/60 font-semibold text-sm transition-colors active:scale-[0.98] cursor-pointer inline-flex items-center justify-center"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isDeletingSettlement}
              onClick={handleConfirmDeleteSettlement}
              className="h-11 px-5 rounded-xl border border-rose-500/40 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold text-sm transition-colors active:scale-[0.98] cursor-pointer disabled:opacity-50 inline-flex items-center justify-center shadow-sm"
            >
              {deleteSettlementLabel}
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
            <div
              role="alert"
              className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{groupDeleteError}</span>
            </div>
          )}

          <p className="text-sm text-zinc-300 leading-relaxed">
            Tem certeza absoluta que deseja excluir o grupo <strong>{group?.name}</strong> e todo o seu histórico de despesas e acertos? Esta ação não pode ser desfeita.
          </p>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={() => {
                setGroupDeleteConfirmOpen(false);
                setGroupDeleteError(null);
              }}
              className="h-11 px-4 rounded-xl border border-zinc-800 text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800/60 font-semibold text-sm transition-colors active:scale-[0.98] cursor-pointer inline-flex items-center justify-center"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isDeletingGroup}
              onClick={handleConfirmDeleteGroup}
              className="h-11 px-5 rounded-xl border border-rose-500/40 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold text-sm transition-colors active:scale-[0.98] cursor-pointer disabled:opacity-50 inline-flex items-center justify-center shadow-sm"
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
        <div className="py-24 flex flex-col items-center justify-center animate-fade-in">
          <RefreshCw className="w-8 h-8 text-accent animate-spin mb-3" />
          <p className="text-zinc-400 text-sm">Carregando grupo de despesas...</p>
        </div>
      }
    >
      <GroupDetailContent />
    </React.Suspense>
  );
}
