import React from 'react';
import Link from 'next/link';
import type { SplitPublicDto } from '@/lib/api';
import { formatBRL, formatDate } from '@/lib/formatters';
import { splitAdminPath } from '@/lib/routes';
import { Money } from '@/components/ui/Money';
import { PaidProgress } from '@/components/splits/PixQrModal';
import { CopyButton } from '@/components/ui/CopyButton';
import { Share2 } from 'lucide-react';

interface SplitPublicHeaderProps {
  split: SplitPublicDto;
  progressPct: number;
  savedToken: string | null;
}

export function SplitPublicHeader({
  split,
  progressPct,
  savedToken,
}: SplitPublicHeaderProps) {
  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <header className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6 space-y-5 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-50 break-words">
            {split.title}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            {split.receiverName} &middot; {formatDate(split.createdAt)}
          </p>
        </div>
        <div className="sm:text-right shrink-0">
          <Money value={split.totalAmount} className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-50" />
        </div>
      </div>

      <div className="space-y-2">
        <PaidProgress paid={split.paidCount} total={split.participants.length} pct={progressPct} />
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-zinc-400">
          <span>
            Recebido <Money value={split.paidAmount} className="font-semibold text-zinc-200" /> ({progressPct}%)
          </span>
          {split.pendingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-amber-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              {split.pendingCount} aguardando confirmação
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/60">
        <CopyButton
          text={pageUrl}
          label="Copiar link"
          copiedLabel="Link copiado"
          size="sm"
        />
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            type="button"
            onClick={() =>
              navigator.share?.({
                title: split.title,
                text: `Racha de conta: ${split.title} (${formatBRL(split.totalAmount)})`,
                url: pageUrl,
              })
            }
            className="inline-flex items-center gap-1.5 px-3.5 min-h-11 text-sm rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 font-medium transition active:scale-[0.98] cursor-pointer"
          >
            <Share2 className="w-4 h-4" /> Compartilhar
          </button>
        )}
        {savedToken && (
          <Link
            href={splitAdminPath(split.slug, savedToken)}
            className="ml-auto text-sm font-medium text-accent hover:text-accent-hover min-h-11 flex items-center transition"
          >
            Painel do organizador &rarr;
          </Link>
        )}
      </div>
    </header>
  );
}
