import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'amber' | 'rose' | 'blue' | 'purple' | 'slate';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({
  children,
  variant = 'slate',
  size = 'md',
  className = '',
}: BadgeProps) {
  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs font-medium px-2.5 py-1',
  }[size];

  const variantStyles = {
    emerald: '   bg-emerald-950/40 text-emerald-400 border-emerald-800',
    amber: '   bg-amber-950/40 text-amber-400 border-amber-800',
    rose: '   bg-rose-950/40 text-rose-400 border-rose-800',
    blue: '   bg-blue-950/40 text-blue-400 border-blue-800',
    purple: '   bg-purple-950/40 text-purple-400 border-purple-800',
    slate: '   bg-zinc-900 text-zinc-300 border-zinc-800',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border ${sizeStyles} ${variantStyles} ${className}`}
    >
      {children}
    </span>
  );
}
