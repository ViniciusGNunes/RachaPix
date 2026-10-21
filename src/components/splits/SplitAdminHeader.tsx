import React from 'react';
import Link from 'next/link';
import type { SplitAdminDto } from '@/lib/api';
import { splitPath } from '@/lib/routes';
import { CopyButton } from '@/components/ui/CopyButton';
import { Money } from '@/components/ui/Money';
import { PaidProgress } from '@/components/splits/PixQrModal';

interface SplitAdminHeaderProps {
  split: SplitAdminDto;
  slug: string;
  refreshing: boolean;
  progressPct: number;
  publicUrl: string;
  onOpenDeleteModal: () => void;
}

export function SplitAdminHeader({
  split,
  slug,
  refreshing,
  progressPct,
  publicUrl,
  onOpenDeleteModal,
}: SplitAdminHeaderProps) {
  return (
    <header className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6 space-y-5 shadow-sm backdrop-blur-sm">
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-50 break-words">
            {split.title}
          </h1>
          {refreshing && (
            <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />{' '}
              Atualizando...
            </span>
          )}
        </div>
        <p className="text-sm text-zinc-400">
          Pix de <span className="font-medium text-zinc-200">{split.receiverName}</span> ({split.receiverCity}) &middot; {split.pixKeyType}:{' '}
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 break-all">{split.pixKey}</span>
        </p>
      </div>

      {/* Financial overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60">
          <p className="text-xs text-zinc-400 font-medium">Total</p>
          <Money value={split.totalAmount} className="text-lg font-bold text-zinc-100 mt-0.5" />
        </div>
        <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
          <p className="text-xs text-emerald-400 font-medium">Recebido</p>
          <Money value={split.paidAmount} className="text-lg font-bold text-emerald-400 mt-0.5" />
        </div>
        <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <p className="text-xs text-amber-400 font-medium">Falta receber</p>
          <Money value={Math.max(0, split.totalAmount - split.paidAmount)} className="text-lg font-bold text-amber-400 mt-0.5" />
        </div>
      </div>

      <div className="space-y-2">
        <PaidProgress paid={split.paidCount} total={split.participants.length} pct={progressPct} />
        {split.pendingCount > 0 && (
          <p className="text-xs sm:text-sm text-amber-400 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            {split.pendingCount} aguardando confirmação
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/60">
        <CopyButton text={publicUrl} label="Copiar link do grupo" variant="primary" size="sm" />
        <Link
          href={splitPath(slug)}
          className="inline-flex items-center px-3.5 min-h-11 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-sm font-medium text-zinc-300 transition active:scale-[0.98]"
        >
          Ver página pública
        </Link>
        <button
          type="button"
          onClick={onOpenDeleteModal}
          className="ml-auto inline-flex items-center px-3 min-h-11 text-xs sm:text-sm font-medium text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
        >
          Excluir racha
        </button>
      </div>
    </header>
  );
}
