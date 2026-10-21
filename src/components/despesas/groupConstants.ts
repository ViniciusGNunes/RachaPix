import {
  ApiError,
  ExpenseCategory,
  ExpenseDto,
  PixKeyType,
} from '@/lib/api';
import { PIX_KEY_TYPE_LABELS } from '@/lib/formatters';
import {
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
  type LucideIcon,
} from 'lucide-react';

export type TabType = 'expenses' | 'balances' | 'settlements' | 'stats' | 'members';

export const PIX_KEY_TYPE_OPTIONS = (Object.keys(PIX_KEY_TYPE_LABELS) as PixKeyType[]).map((t) => ({
  value: t,
  label: PIX_KEY_TYPE_LABELS[t],
}));

export const CATEGORIES: ExpenseCategory[] = [
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

export const CATEGORY_STYLE: Record<ExpenseCategory, { icon: LucideIcon; cls: string }> = {
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

export function isoDay(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 'Hoje', 'Ontem' ou '12 out'. */
export function dayLabel(date: string): string {
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

export function groupByDay<T extends { date: string }>(items: T[]): { key: string; label: string; items: T[] }[] {
  const map = new Map<string, T[]>();
  for (const it of [...items].sort((a, b) => b.date.localeCompare(a.date))) {
    const k = it.date.slice(0, 10);
    map.set(k, [...(map.get(k) ?? []), it]);
  }
  return [...map.entries()].map(([key, list]) => ({ key, label: dayLabel(key), items: list }));
}

export type PillTone = 'emerald' | 'amber' | 'rose' | 'neutral';

export const PILL_STYLE: Record<PillTone, string> = {
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  rose: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  neutral: 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60',
};

export const PILL_DOT: Record<PillTone, string> = {
  emerald: 'bg-emerald-400',
  amber: 'bg-amber-400',
  rose: 'bg-rose-400',
  neutral: 'bg-zinc-500',
};

export function errorMessageOr(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export function getExpenseStatus(exp: ExpenseDto): { label: string; title: string; tone: PillTone } | null {
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
