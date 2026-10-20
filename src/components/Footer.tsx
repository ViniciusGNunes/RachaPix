'use client';

import React from 'react';
import Link from 'next/link';
import { LogoMark } from '@/components/Logo';
import { PROJECT_NOTE, SHORT_LEGAL_NOTICE } from '@/lib/legal';

export function Footer() {
  return (
    <footer className="border-t border-zinc-800/80 mt-auto bg-zinc-950/60 pt-6 pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-zinc-400">
            <LogoMark className="w-8 h-8" />
            <span className="font-semibold text-zinc-200">RachaConta</span>
            <span>&copy; 2026</span>
            <span className="text-zinc-600 hidden sm:inline">&middot;</span>
            <span className="text-zinc-500 hidden sm:inline">
              Divisão inteligente de contas com Pix
            </span>
          </div>

          <nav className="flex items-center gap-3 text-xs text-zinc-400" aria-label="Links legais">
            <Link
              href="/termos"
              className="hover:text-zinc-200 transition-colors underline-offset-4 hover:underline"
            >
              Termos de Uso
            </Link>
            <span className="text-zinc-700" aria-hidden="true">&middot;</span>
            <Link
              href="/privacidade"
              className="hover:text-zinc-200 transition-colors underline-offset-4 hover:underline"
            >
              Privacidade
            </Link>
          </nav>
        </div>

        <p className="text-[11px] sm:text-xs text-zinc-500 leading-relaxed border-t border-zinc-800/40 pt-3">
          {PROJECT_NOTE} {SHORT_LEGAL_NOTICE}
        </p>
      </div>
    </footer>
  );
}
