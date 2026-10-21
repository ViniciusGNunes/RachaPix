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
}: Readonly<SplitAdminHeaderProps>) {
  return (
    <header className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 sm:p-5 space-y-4">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-50 break-words">
            {split.title}
          </h1>
          {refreshing && (
            <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />{' '}
              Atualizando...
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-zinc-400">
          Pix de <span className="font-medium text-zinc-200">{split.receiverName}</span> ({split.receiverCity}) &middot; {split.pixKeyType}:{' '}
          <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 break-all">{split.pixKey}</span>
        </p>
      </div>

      {/* Financial overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="p-3 rounded-md border border-zinc-800 bg-zinc-950/60">
          <p className="text-xs text-zinc-400 font-medium">Total</p>
          <Money value={split.totalAmount} className="text-lg font-bold text-zinc-100 mt-0.5" />
        </div>
        <div className="p-3 rounded-md border border-emerald-500/20 bg-emerald-500/5">
          <p className="text-xs text-emerald-400 font-medium">Recebido</p>
          <Money value={split.paidAmount} className="text-lg font-bold text-emerald-400 mt-0.5" />
        </div>
        <div className="p-3 rounded-md border border-amber-500/20 bg-amber-500/5">
          <p className="text-xs text-amber-400 font-medium">Falta receber</p>
          <Money value={Math.max(0, split.totalAmount - split.paidAmount)} className="text-lg font-bold text-amber-400 mt-0.5" />
        </div>
      </div>

      <div className="space-y-1.5">
        <PaidProgress paid={split.paidCount} total={split.participants.length} pct={progressPct} />
        {split.pendingCount > 0 && (
          <p className="text-xs sm:text-sm text-amber-400 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            {split.pendingCount} aguardando confirmação
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800">
        <CopyButton text={publicUrl} label="Copiar link do grupo" variant="primary" size="sm" />
        <Link
          href={splitPath(slug)}
          className="inline-flex items-center px-3 h-9 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs sm:text-sm font-medium text-zinc-300 transition-colors"
        >
          Ver página pública
        </Link>
        <button
          type="button"
          onClick={onOpenDeleteModal}
          className="ml-auto inline-flex items-center px-2.5 h-9 text-xs sm:text-sm font-medium text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
        >
          Excluir racha
        </button>
      </div>
    </header>
  );
}
