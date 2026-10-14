'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '../ui/Modal';
import { CopyButton } from '../ui/CopyButton';
import { formatBRL } from '@/lib/formatters';
import { QrCode, CheckCircle2, Clock } from 'lucide-react';

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
}: PixQrModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="flex flex-col items-center text-center space-y-5">
        {/* Value Callout */}
        <div className="w-full bg-emerald-950/40 border border-emerald-800 rounded-xl p-4">
          <p className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">
            Valor a Pagar
          </p>
          <p className="text-3xl font-semibold text-emerald-200 mt-0.5">
            {formatBRL(amount)}
          </p>
          <p className="text-xs text-emerald-400 mt-1">
            Recebedor: <span className="font-semibold">{receiverName}</span>
            {pixKey && <span className="ml-1 opacity-75">({pixKey})</span>}
          </p>
        </div>

        {/* QR Code Container */}
        <div className="bg-zinc-950 p-4 rounded-xl shadow-inner border border-zinc-800 flex flex-col items-center justify-center">
          <QRCodeSVG
            value={pixCode}
            size={220}
            level="M"
            includeMargin={true}
            className="w-48 h-48 sm:w-56 sm:h-56"
          />
          <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1">
            <QrCode className="w-3.5 h-3.5" /> Aponte a câmera do aplicativo do seu banco
          </p>
        </div>

        {/* Pix Copia e Cola */}
        <div className="w-full text-left space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">
            Pix Copia e Cola
          </label>
          <div className="relative">
            <textarea
              readOnly
              rows={2}
              value={pixCode}
              className="w-full p-2.5 text-xs font-mono bg-zinc-900/80 border border-zinc-800 rounded-lg text-zinc-300 resize-none select-all focus:outline-none"
            />
          </div>
          <div className="flex justify-end pt-1">
            <CopyButton
              text={pixCode}
              label="Copiar Código Pix"
              copiedLabel="Código Pix Copiado!"
              variant="primary"
              size="md"
              className="w-full justify-center"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full pt-2 flex flex-col gap-2">
          {isPaid ? (
            <div className="flex items-center justify-center gap-2 p-3 bg-emerald-950/60 text-emerald-300 rounded-xl font-medium text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Pagamento confirmado!
            </div>
          ) : isPending ? (
            <div className="flex flex-col items-center gap-0.5 p-3 bg-blue-950/40 border border-blue-800 text-blue-300 rounded-xl text-sm text-center">
              <span className="flex items-center gap-2 font-medium">
                <Clock className="w-5 h-5 text-blue-400" />
                Pagamento informado
              </span>
              <span className="text-xs text-blue-400">Aguardando confirmação do organizador.</span>
            </div>
          ) : (
            onMarkPaid && (
              <button
                type="button"
                onClick={onMarkPaid}
                disabled={isMarkingPaid}
                className="w-full py-3 px-4 rounded-xl bg-zinc-100 text-zinc-900 font-semibold hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {isMarkingPaid ? (
                  'Confirmando...'
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Já paguei, avisar organizador
                  </>
                )}
              </button>
            )
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl text-zinc-400 hover:bg-zinc-900 font-medium text-sm transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
}
