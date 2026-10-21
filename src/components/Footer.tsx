'use client';

import React from 'react';
import Link from 'next/link';
import { LogoMark } from '@/components/Logo';
import { PROJECT_NOTE, SHORT_LEGAL_NOTICE } from '@/lib/legal';

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 mt-auto bg-zinc-950 pt-5 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-400">
            <LogoMark className="w-6 h-6" />
            <span className="font-semibold text-zinc-200">RachaPix</span>
            <span>&copy; 2026</span>
            <span className="text-zinc-500 hidden sm:inline" aria-hidden="true">&middot;</span>
            <span className="text-zinc-400 hidden sm:inline">
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
            <span className="text-zinc-500" aria-hidden="true">&middot;</span>
            <Link
              href="/privacidade"
              className="hover:text-zinc-200 transition-colors underline-offset-4 hover:underline"
            >
              Privacidade
            </Link>
          </nav>
        </div>

        <p className="text-[11px] sm:text-xs text-zinc-400 leading-relaxed border-t border-zinc-800 pt-2.5">
          {PROJECT_NOTE} {SHORT_LEGAL_NOTICE}
        </p>
      </div>
    </footer>
  );
}
