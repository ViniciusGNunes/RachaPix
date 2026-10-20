'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, QrCode, Trash2 } from 'lucide-react';
import { api, ApiError, type DeviceDto, type LinkCodeDto } from '@/lib/api';
import { absoluteUrl, deviceLinkPath } from '@/lib/routes';
import { CopyButton } from '@/components/ui/CopyButton';
import { toast } from '@/components/ui/Toast';

interface DevicesPanelProps {
  groupId: string;
  /** Current invite token; the new device needs it to reach the group before it has an identity. */
  inviteToken?: string | null;
}

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function formatLastSeen(iso: string | null): string {
  if (!iso) return 'nunca usado';
  return `visto em ${new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`;
}

export function DevicesPanel({ groupId, inviteToken }: Readonly<DevicesPanelProps>) {
  const [devices, setDevices] = useState<DeviceDto[]>([]);
  const [link, setLink] = useState<LinkCodeDto | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [generating, setGenerating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadDevices = useCallback(async () => {
    try {
      setDevices(await api.listDevices(groupId));
    } catch (err) {
      console.error('Error loading devices:', err);
    }
  }, [groupId]);

  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  const expiresMs = link ? new Date(link.expiresAt).getTime() : 0;
  const remaining = expiresMs - now;
  const active = link !== null && remaining > 0;

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.createLinkCode(groupId);
      setNow(Date.now());
      setLink(res);
      void loadDevices();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Não foi possível gerar o código.');
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    setRevokingId(id);
    try {
      await api.revokeDevice(groupId, id);
      toast.success('Aparelho desconectado.');
      await loadDevices();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Não foi possível desconectar o aparelho.');
    } finally {
      setRevokingId(null);
    }
  };

  const linkUrl =
    active && link && inviteToken ? absoluteUrl(deviceLinkPath(groupId, inviteToken, link.code)) : null;

  return (
    <section className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 shadow-sm space-y-4">
      <div className="flex items-start gap-3">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent/12 text-accent border border-accent/25 shrink-0">
          <Smartphone className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-zinc-50 tracking-tight">Meus aparelhos</h3>
          <p className="mt-0.5 text-sm text-zinc-400 leading-relaxed">
            Use o mesmo nome em outro celular ou computador. Gere um código aqui e abra o link no outro aparelho.
          </p>
        </div>
      </div>

      {active && linkUrl ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 flex flex-col sm:flex-row gap-4 items-center">
          <div className="bg-white p-2.5 rounded-xl shrink-0">
            <QRCodeSVG value={linkUrl} size={132} />
          </div>
          <div className="min-w-0 w-full space-y-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-mono text-xl font-semibold tracking-[0.2em] text-zinc-50">{link.code}</span>
              <span className="text-xs text-zinc-400 tabular-nums">expira em {formatRemaining(remaining)}</span>
            </div>
            <div className="flex gap-2">
              <input
                readOnly
                value={linkUrl}
                onFocus={(e) => e.currentTarget.select()}
                aria-label="Link para conectar outro aparelho"
                className="flex-1 min-w-0 text-xs bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 font-mono text-zinc-300 truncate"
              />
              <CopyButton text={linkUrl} size="sm" />
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Vale para um único uso. Não compartilhe com ninguém: quem abrir o link entra como você.
            </p>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating || !inviteToken}
          className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg text-sm font-semibold disabled:opacity-50 active:scale-[0.98] transition cursor-pointer"
        >
          <QrCode className="w-4 h-4" />
          {generating ? 'Gerando...' : link ? 'Gerar novo código' : 'Conectar outro aparelho'}
        </button>
      )}

      {active && (
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="text-xs font-medium text-zinc-400 hover:text-zinc-200 cursor-pointer disabled:opacity-50"
        >
          {generating ? 'Gerando...' : 'Gerar outro código (o atual deixa de valer)'}
        </button>
      )}

      {devices.length > 0 && (
        <ul className="divide-y divide-zinc-800/80 rounded-xl border border-zinc-800/80">
          {devices.map((d) => (
            <li key={d.id} className="flex items-center gap-3 px-3.5 py-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-zinc-100 truncate">
                  {d.label || 'Aparelho sem nome'}
                  {d.isCurrent && <span className="ml-2 text-xs font-normal text-accent">este aparelho</span>}
                </div>
                <div className="text-xs text-zinc-500">{formatLastSeen(d.lastUsedAt)}</div>
              </div>
              {!d.isCurrent && (
                <button
                  type="button"
                  onClick={() => handleRevoke(d.id)}
                  disabled={revokingId === d.id}
                  aria-label={`Desconectar ${d.label || 'aparelho'}`}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {revokingId === d.id ? 'Removendo...' : 'Desconectar'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
