'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function CopyButton({
  text,
  label = 'Copiar',
  copiedLabel = 'Copiado',
  className = '',
  variant = 'outline',
  size = 'md',
}: Readonly<CopyButtonProps>) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-md transition-all duration-150 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer';

  const sizeStyles = {
    sm: 'h-8 text-xs px-2.5 gap-1.5 max-sm:h-10',
    md: 'h-9 text-xs sm:text-sm px-3 gap-1.5 max-sm:h-11',
    lg: 'h-9 sm:h-10 text-sm px-3.5 gap-2 max-sm:h-11',
  }[size];

  const variantStyles = {
    primary: 'bg-accent text-accent-fg hover:bg-accent-hover',
    secondary: 'bg-zinc-900 text-zinc-100 hover:bg-zinc-800 border border-zinc-800',
    outline: 'border border-zinc-800 text-zinc-200 hover:bg-zinc-900 hover:border-zinc-700',
    ghost: 'text-zinc-300 hover:bg-zinc-900',
  }[variant];

  let copiedStyles = '';
  if (copied) {
    copiedStyles =
      variant === 'primary'
        ? '!bg-emerald-600 !text-white'
        : '!border-emerald-500/40 !bg-emerald-500/10 !text-emerald-400';
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${copiedStyles} ${className}`}
      aria-live="polite"
      title={copied ? copiedLabel : label}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-emerald-400 animate-pop shrink-0" />
          <span>{copiedLabel}</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4 text-zinc-400 shrink-0" />
          {label && <span>{label}</span>}
        </>
      )}
    </button>
  );
}
