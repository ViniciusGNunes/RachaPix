import React from 'react';
import Link from 'next/link';
import type { SplitAdminDto } from '@/lib/api';
import { absoluteUrl, splitAdminPath, splitPath } from '@/lib/routes';
import { Money } from '@/components/ui/Money';
import { CopyButton } from '@/components/ui/CopyButton';
import { Check } from 'lucide-react';

interface SplitCreatedSuccessProps {
  createdSplit: SplitAdminDto;
}

export function SplitCreatedSuccess({ createdSplit }: SplitCreatedSuccessProps) {
  const publicUrl = absoluteUrl(splitPath(createdSplit.slug));
  const adminUrl = absoluteUrl(splitAdminPath(createdSplit.slug, createdSplit.adminToken));

  return (
    <div className="w-full max-w-4xl lg:max-w-none lg:w-[60vw] mx-auto px-4 sm:px-6 py-12 space-y-8 animate-fade-up">
      <div className="p-6 sm:p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center animate-pop">
            <Check className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Racha criado</h1>
          <p className="text-zinc-400 text-sm">
            {createdSplit.title} &middot; <Money value={createdSplit.totalAmount} />
          </p>
        </div>

        <div className="space-y-6 pt-2">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">Link dos participantes</h2>
            <p className="text-xs text-zinc-400 mb-2">Envie no grupo.</p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={publicUrl}
                className="flex-1 min-w-0 text-xs bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 font-mono text-zinc-300 truncate"
              />
              <CopyButton text={publicUrl} label="Copiar" variant="secondary" />
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-zinc-200">Seu link de administrador</h2>
            <p className="text-xs text-amber-400/90 mb-2">
              Guarde este link. Com ele você confere quem pagou.
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={adminUrl}
                className="flex-1 min-w-0 text-xs bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 font-mono text-zinc-300 truncate"
              />
              <CopyButton text={adminUrl} label="Copiar" variant="secondary" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Link
            href={splitPath(createdSplit.slug)}
            className="h-12 px-4 rounded-xl border border-zinc-800 font-semibold text-zinc-200 hover:bg-zinc-800/60 text-sm flex items-center justify-center transition-colors active:scale-[0.98]"
          >
            Ver página pública
          </Link>
          <Link
            href={splitAdminPath(createdSplit.slug, createdSplit.adminToken)}
            className="h-12 px-4 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg font-semibold text-sm flex items-center justify-center transition-colors active:scale-[0.98]"
          >
            Abrir painel
          </Link>
        </div>
      </div>
    </div>
  );
}
