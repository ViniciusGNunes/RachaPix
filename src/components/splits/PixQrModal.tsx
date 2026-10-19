'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '../ui/Modal';
import { Money } from '@/components/ui/Money';
import { toast } from '@/components/ui/Toast';
import { Copy, Check, ChevronDown, Lock, Share2 } from 'lucide-react';
import { useTermsAccepted, TermsConsentCheckbox, TermsShortNotice } from '@/components/TermsConsent';

/* ---------- Shared small pieces (also used by /r and /r/admin) ---------- */

export type PillStatus = 'paid' | 'pending' | 'overdue';

const PILL_STYLES: Record<PillStatus, { pill: string; dot: string; label: string }> = {
  paid: {
    pill: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    dot: 'bg-emerald-400',
    label: 'Pago',
  },
  pending: {
    pill: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    dot: 'bg-amber-400',
    label: 'Pendente',
  },
  overdue: {
    pill: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    dot: 'bg-rose-400',
    label: 'Em atraso',
  },
};

export function StatusPill({ status, label }: { status: PillStatus; label?: string }) {
  const s = PILL_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.pill}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {label ?? s.label}
    </span>
  );
}

/** Barra fina "X de Y pagaram" com animação suave. */
export function PaidProgress({
  paid,
  total,
  pct,
}: {
  paid: number;
  total: number;
  pct: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs sm:text-sm font-medium text-zinc-400">
        <span>
          {paid} de {total} pagaram
        </span>
        <span className="tabular-nums font-semibold text-zinc-300">{pct}%</span>
      </div>
      <div
        className="w-full bg-zinc-800/80 h-2 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="bg-accent h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function SecuritySeal() {
  return (
    <p className="flex items-center justify-center gap-1.5 text-xs text-zinc-400">
      <Lock className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
      Pagamento direto via Pix, sem intermediário
    </p>
  );
}

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

interface PaymentReceiptProps {
  amount: number;
  splitTitle?: string;
  payerName?: string;
  receiverName: string;
  participantId?: string;
  paidAt?: string | Date | null;
}

/** Comprovante de pagamento. */
export function PaymentReceipt({
  amount,
  splitTitle,
  payerName,
  receiverName,
  participantId,
  paidAt,
}: PaymentReceiptProps) {
  const [when] = React.useState(() => (paidAt ? new Date(paidAt) : new Date()));
  const dateText = when.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  const shortId = participantId ? participantId.slice(0, 8).toUpperCase() : null;

  const summary = [
    'Comprovante de pagamento',
    `Valor: ${brl.format(amount)}`,
    splitTitle ? `Racha: ${splitTitle}` : null,
    payerName ? `Pagador: ${payerName}` : null,
    `Recebedor: ${receiverName}`,
    `Data: ${dateText}`,
    shortId ? `Código: ${shortId}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const handleShare = async () => {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ title: 'Comprovante de pagamento', text: summary });
        return;
      }
      await navigator.clipboard.writeText(summary);
      toast.success('Comprovante copiado');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      toast.error('Não foi possível compartilhar o comprovante.');
    }
  };

  const rows: Array<[string, string]> = [];
  if (splitTitle) rows.push(['Racha', splitTitle]);
  if (payerName) rows.push(['Pagador', payerName]);
  rows.push(['Recebedor', receiverName]);
  rows.push(['Data e hora', dateText]);
  if (shortId) rows.push(['Código', shortId]);

  return (
    <div className="w-full text-left border border-zinc-800 bg-zinc-900/50 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
          <Check className="w-3.5 h-3.5" />
        </div>
        <p className="text-sm font-semibold text-zinc-100">
          Pagamento registrado
        </p>
      </div>
      <dl className="space-y-2 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-4 py-1.5 border-b border-zinc-800/40 last:border-0">
            <dt className="text-zinc-400 shrink-0 font-normal">{k}</dt>
            <dd
              className={`text-zinc-100 text-right break-words min-w-0 font-medium ${
                k === 'Código' ? 'font-mono text-xs px-2 py-0.5 rounded bg-zinc-800/70 tracking-wider text-zinc-300' : ''
              }`}
            >
              {v}
            </dd>
          </div>
        ))}
      </dl>
      <button
        type="button"
        onClick={handleShare}
        className="w-full min-h-11 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 text-sm font-medium flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Share2 className="w-4 h-4" /> Compartilhar
      </button>
    </div>
  );
}

/* ---------- Modal ---------- */

interface PixQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  receiverName: string;
  amount: number;
  pixCode: string;
  pixKey?: string;
  onMarkPaid?: () => void;
  isMarkingPaid?: boolean;
  isPaid?: boolean;
  isPending?: boolean;
  /** Dados opcionais para o comprovante. */
  splitTitle?: string;
  payerName?: string;
  participantId?: string;
}

export function PixQrModal({
  isOpen,
  onClose,
  title = 'Pagamento via Pix',
  receiverName,
  amount,
  pixCode,
  pixKey,
  onMarkPaid,
  isMarkingPaid = false,
  isPaid = false,
  isPending = false,
  splitTitle,
  payerName,
  participantId,
}: PixQrModalProps) {
  const [copied, setCopied] = React.useState(false);
  const [showQr, setShowQr] = React.useState(false);
  const { accepted } = useTermsAccepted();

  const handleCopy = async () => {
    if (!accepted) {
      toast.error('Aceite os Termos de Uso e a Política de Privacidade para continuar.');
      return;
    }
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      toast.success('Código Pix copiado');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Não foi possível copiar. Selecione o código manualmente.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="flex flex-col space-y-6">
        <div className="text-center py-2">
          <p className="text-xs uppercase tracking-wider font-medium text-zinc-400">
            {isPaid ? 'Valor pago' : 'Valor a pagar'}
          </p>
          <Money value={amount} animate className="block text-4xl sm:text-5xl font-bold tracking-tight text-zinc-50 mt-1.5" />
          <p className="text-sm text-zinc-400 mt-2 break-words">
            Para <span className="font-semibold text-zinc-200">{receiverName}</span>
            {pixKey && (
              <span className="block text-xs font-mono text-zinc-400 mt-1.5 break-all bg-zinc-900/80 border border-zinc-800/80 rounded-lg px-2.5 py-1 inline-block max-w-full">
                {pixKey}
              </span>
            )}
          </p>
        </div>

        {isPaid && (
          <PaymentReceipt
            amount={amount}
            splitTitle={splitTitle}
            payerName={payerName}
            receiverName={receiverName}
            participantId={participantId}
          />
        )}
        {!isPaid && isPending && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-center text-amber-300">
            Pagamento informado. Aguardando confirmação do organizador.
          </div>
        )}

        {!isPaid && !accepted && (
          <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-2">
            <TermsConsentCheckbox id="modal-terms-consent" />
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!accepted}
            className="w-full h-12 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg font-semibold text-base flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copied ? (
              <Check key="ok" className="w-5 h-5 animate-pop" />
            ) : (
              <Copy key="copy" className="w-5 h-5" />
            )}
            {copied ? 'Código copiado' : 'Copiar código Pix'}
          </button>
          <SecuritySeal />
        </div>

        <div className="w-full">
          <button
            type="button"
            onClick={() => setShowQr((v) => !v)}
            disabled={!accepted}
            aria-expanded={showQr}
            className="mx-auto min-h-11 px-3.5 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl hover:bg-zinc-900/60 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {showQr ? 'Ocultar QR Code' : 'Mostrar QR Code'}
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showQr ? 'rotate-180' : ''}`} />
          </button>
          {showQr && accepted && (
            <div className="mt-3 bg-white p-4 rounded-2xl flex flex-col items-center shadow-lg border border-zinc-200/20 animate-fade-in">
              <QRCodeSVG
                value={pixCode}
                size={220}
                level="M"
                includeMargin={true}
                className="w-48 h-48 sm:w-56 sm:h-56"
              />
            </div>
          )}
        </div>

        <div className="w-full space-y-1.5">
          <label htmlFor="pix-copia-cola" className="text-xs font-medium text-zinc-400">
            Pix Copia e Cola
          </label>
          <textarea
            id="pix-copia-cola"
            readOnly
            rows={2}
            value={accepted ? pixCode : 'Aceite os Termos de Uso e a Política de Privacidade para visualizar o código Pix.'}
            className="w-full p-3 text-xs font-mono bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 resize-none select-all focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent leading-relaxed disabled:opacity-60"
          />
        </div>

        <TermsShortNotice />

        <div className="flex flex-col gap-2.5 pt-1">
          {!isPaid && !isPending && onMarkPaid && (
            <button
              type="button"
              onClick={onMarkPaid}
              disabled={isMarkingPaid}
              className="w-full h-11 px-4 rounded-xl border border-zinc-700/80 hover:border-zinc-600 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-100 font-medium transition active:scale-[0.98] disabled:opacity-50 text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {isMarkingPaid ? 'Registrando...' : 'Já paguei'}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-11 px-4 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 text-sm font-medium transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
}
