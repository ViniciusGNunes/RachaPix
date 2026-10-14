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
  copiedLabel = 'Copiado!',
  className = '',
  variant = 'outline',
  size = 'md',
}: CopyButtonProps) {
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
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-600 cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1 gap-1',
    md: 'text-sm px-3.5 py-1.5 gap-1.5',
    lg: 'text-base px-4 py-2 gap-2',
  }[size];

  const variantStyles = {
    primary: 'bg-zinc-50 text-zinc-950 hover:bg-zinc-200',
    secondary: '   bg-zinc-900 text-zinc-100 hover:bg-zinc-800',
    outline: 'border border-zinc-800 text-zinc-200 hover:bg-zinc-900',
    ghost: ' text-zinc-300 hover:bg-zinc-900',
  }[variant];

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      title={copied ? copiedLabel : label}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-zinc-50" />
          <span>{copiedLabel}</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4 text-zinc-400" />
          {label && <span>{label}</span>}
        </>
      )}
    </button>
  );
}
