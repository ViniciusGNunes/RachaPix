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
    <div className="w-full max-w-4xl lg:max-w-none lg:w-[60vw] mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-up">
      <div className="p-5 sm:p-7 rounded-lg bg-zinc-900 border border-zinc-800 space-y-5">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center animate-pop">
            <Check className="w-5 h-5 stroke-[2.5]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-50">Racha criado</h1>
          <p className="text-zinc-400 text-sm">
            {createdSplit.title} &middot; <Money value={createdSplit.totalAmount} />
          </p>
        </div>

        <div className="space-y-4 pt-1">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">Link dos participantes</h2>
            <p className="text-xs text-zinc-400 mb-1.5">Envie no grupo.</p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={publicUrl}
                className="flex-1 min-w-0 h-9 text-xs bg-zinc-950 border border-zinc-800 rounded-md px-3 font-mono text-zinc-300 truncate"
              />
              <CopyButton text={publicUrl} label="Copiar" variant="secondary" />
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-zinc-200">Seu link de administrador</h2>
            <p className="text-xs text-amber-400/90 mb-1.5">
              Guarde este link. Com ele você confere quem pagou.
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={adminUrl}
                className="flex-1 min-w-0 h-9 text-xs bg-zinc-950 border border-zinc-800 rounded-md px-3 font-mono text-zinc-300 truncate"
              />
              <CopyButton text={adminUrl} label="Copiar" variant="secondary" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <Link
            href={splitPath(createdSplit.slug)}
            className="h-9 px-4 rounded-md border border-zinc-800 font-semibold text-zinc-200 hover:bg-zinc-800/60 text-sm flex items-center justify-center transition-colors"
          >
            Ver página pública
          </Link>
          <Link
            href={splitAdminPath(createdSplit.slug, createdSplit.adminToken)}
            className="h-9 px-4 rounded-md bg-accent hover:bg-accent-hover text-accent-fg font-semibold text-sm flex items-center justify-center transition-colors"
          >
            Abrir painel
          </Link>
        </div>
      </div>
    </div>
  );
}
