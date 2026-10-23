'use client';

import React, { useState } from 'react';
import { Lock, Share2, RefreshCw, KeyRound } from 'lucide-react';
import { CopyButton } from '@/components/ui/CopyButton';
import { absoluteUrl, groupPath } from '@/lib/routes';

interface InvitePanelProps {
  groupId: string;
  /** Invite token. Without it there is nothing to share. */
  inviteToken?: string | null;
  /** Admin recovery token, shown only to the admin. */
  adminToken?: string | null;
  isAdmin: boolean;
  /** Admin only: replaces the invite and resolves with the new token. */
  onRotate?: () => Promise<void>;
  /** `hero` is the big first-time card; `card` sits inside the group page. */
  variant?: 'hero' | 'card';
}

/** `#t=` carries the invite token; `#a=` carries the admin recovery token (kept apart so it gets admin rights). */
export function inviteUrlFor(groupId: string, token?: string | null, kind: 'invite' | 'admin' = 'invite'): string {
  const hash = token ? `#${kind === 'admin' ? 'a' : 't'}=${token}` : '';
  return `${absoluteUrl(groupPath(groupId))}${hash}`;
}

export function InvitePanel({
  groupId,
  inviteToken,
  adminToken,
  isAdmin,
  onRotate,
  variant = 'card',
}: Readonly<InvitePanelProps>) {
  const [confirmingRotate, setConfirmingRotate] = useState(false);
  const [rotating, setRotating] = useState(false);

  if (!inviteToken) return null;

  const inviteUrl = inviteUrlFor(groupId, inviteToken);
  const adminUrl = adminToken ? inviteUrlFor(groupId, adminToken, 'admin') : null;
  const message = `Entre no meu grupo no RachaPix: ${inviteUrl}`;
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleShare = async () => {
    try {
      await navigator.share({ title: 'Convite para o grupo', text: 'Entre no meu grupo no RachaPix', url: inviteUrl });
    } catch {
      // user dismissed the share sheet
    }
  };

  const handleRotate = async () => {
    if (!onRotate) return;
    setRotating(true);
    try {
      await onRotate();
    } finally {
      setRotating(false);
      setConfirmingRotate(false);
    }
  };

  const hero = variant === 'hero';

  return (
    <section
      className={`rounded-lg border border-zinc-800 bg-zinc-900 ${hero ? 'p-5 sm:p-6' : 'p-3.5 sm:p-4'}`}
      aria-label="Convite do grupo"
    >
      <div className="flex items-start gap-3">
        <span
          className={`shrink-0 inline-flex items-center justify-center rounded-md bg-accent/15 text-accent border border-accent/25 ${
            hero ? 'w-10 h-10' : 'w-8 h-8'
          }`}
        >
          <Lock className={hero ? 'w-5 h-5' : 'w-4 h-4'} />
        </span>
        <div className="min-w-0">
          <h2 className={`font-semibold text-zinc-50 ${hero ? 'text-lg sm:text-xl' : 'text-sm sm:text-[15px]'}`}>
            {hero ? 'Seu grupo privado está pronto' : 'Grupo privado'}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
            Só entra quem tiver o link de convite. Quem abrir o link escolhe quem é no grupo, e cada
            ação fica ligada a essa pessoa.
          </p>
        </div>
      </div>

      <div className="mt-3.5 flex flex-col sm:flex-row gap-2">
        <input
          readOnly
          value={inviteUrl}
          onFocus={(e) => e.currentTarget.select()}
          aria-label="Link de convite"
          className="flex-1 min-w-0 h-10 sm:h-9 text-xs bg-zinc-950 border border-zinc-800 rounded-md px-3 font-mono text-zinc-300 truncate"
        />
        <div className="flex gap-2">
          <CopyButton
            text={inviteUrl}
            label="Copiar convite"
            copiedLabel="Convite copiado!"
            variant="primary"
            size="md"
            className="flex-1 sm:flex-initial h-10 sm:h-9 text-xs sm:text-sm"
          />
          <a
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center text-xs sm:text-sm font-medium px-3.5 h-10 sm:h-9 rounded-md border border-zinc-800 text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700 transition cursor-pointer"
          >
            WhatsApp
          </a>
          {canNativeShare && (
            <button
              type="button"
              onClick={handleShare}
              aria-label="Compartilhar convite"
              className="inline-flex items-center justify-center w-10 sm:w-9 h-10 sm:h-9 rounded-md border border-zinc-800 text-zinc-200 hover:bg-zinc-800 transition cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="mt-3.5 pt-3.5 border-t border-zinc-800 space-y-2.5">
          {onRotate && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {confirmingRotate ? (
                <>
                  <span className="text-zinc-400">O link atual deixa de funcionar. Continuar?</span>
                  <button
                    type="button"
                    onClick={handleRotate}
                    disabled={rotating}
                    className="h-8 px-2.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-50 text-xs font-semibold disabled:opacity-60 cursor-pointer"
                  >
                    {rotating ? 'Gerando...' : 'Gerar novo link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingRotate(false)}
                    className="h-8 px-2.5 rounded-md text-zinc-400 hover:text-zinc-200 text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingRotate(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Gerar novo link de convite
                </button>
              )}
            </div>
          )}

          {adminUrl && (
            <details className="text-xs text-zinc-400">
              <summary className="inline-flex items-center gap-1.5 cursor-pointer text-zinc-400 hover:text-zinc-200">
                <KeyRound className="w-3.5 h-3.5" /> Link de recuperação do admin
              </summary>
              <p className="mt-1.5 leading-relaxed">
                Guarde este link só para você. Com ele você recupera o acesso de admin em outro aparelho.
                Não compartilhe.
              </p>
              <div className="mt-2 flex gap-2">
                <input
                  readOnly
                  value={adminUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  aria-label="Link de recuperação do admin"
                  className="flex-1 min-w-0 h-9 text-xs bg-zinc-950 border border-zinc-800 rounded-md px-3 font-mono text-zinc-300 truncate"
                />
                <CopyButton text={adminUrl} size="sm" />
              </div>
            </details>
          )}
        </div>
      )}
    </section>
  );
}
