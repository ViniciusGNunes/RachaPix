'use client';

import React from 'react';
import Link from 'next/link';
import { Receipt } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950/50 py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-zinc-50" />
          <span className="font-semibold text-zinc-300">RachaConta</span>
          <span>&copy; 2026 — Divisão de contas e despesas compartilhadas</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/rachar" className="hover:underline">
            Rachar Conta
          </Link>
          <Link href="/despesas" className="hover:underline">
            Despesas em Grupo
          </Link>
        </div>
      </div>
    </footer>
  );
}
