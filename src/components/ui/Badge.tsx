import React from 'react';

type Variant = 'emerald' | 'amber' | 'rose' | 'blue' | 'purple' | 'slate' | 'paid' | 'pending' | 'overdue' | 'neutral';

interface BadgeProps {
  children?: React.ReactNode;
  /** Semantic status (paid/pending/overdue/neutral) or legacy color names. */
  variant?: Variant;
  size?: 'sm' | 'md';
  /** Leading status dot. Default false. */
  dot?: boolean;
  className?: string;
}

const DEFAULT_LABEL: Partial<Record<Variant, string>> = {
  paid: 'Pago',
  pending: 'Pendente',
  overdue: 'Em atraso',
};

const STYLES: Record<Variant, { pill: string; dot: string }> = {
  emerald: { pill: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
  amber: { pill: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-400' },
  rose: { pill: 'bg-rose-500/10 text-rose-400 border-rose-500/20', dot: 'bg-rose-400' },
  blue: { pill: 'bg-accent-muted text-accent border-accent/25', dot: 'bg-accent' },
  purple: { pill: 'bg-purple-500/10 text-purple-400 border-purple-500/20', dot: 'bg-purple-400' },
  slate: { pill: 'bg-zinc-800/60 text-zinc-300 border-zinc-700/40', dot: 'bg-zinc-400' },
  paid: { pill: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
  pending: { pill: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-400' },
  overdue: { pill: 'bg-rose-500/10 text-rose-400 border-rose-500/20', dot: 'bg-rose-400' },
  neutral: { pill: 'bg-zinc-800/60 text-zinc-300 border-zinc-700/40', dot: 'bg-zinc-400' },
};

export function Badge({
  children,
  variant = 'slate',
  size = 'md',
  dot = false,
  className = '',
}: BadgeProps) {
  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs font-medium px-2.5 py-1',
  }[size];
  const s = STYLES[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${sizeStyles} ${s.pill} ${className}`}
    >
      {dot && <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />}
      {children ?? DEFAULT_LABEL[variant]}
    </span>
  );
}
