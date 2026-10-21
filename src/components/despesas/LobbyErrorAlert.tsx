import React from 'react';
import { AlertCircle } from 'lucide-react';

interface LobbyErrorAlertProps {
  error: string;
  onRetry: () => void;
}

export function LobbyErrorAlert({ error, onRetry }: LobbyErrorAlertProps) {
  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3.5">
      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
      <div className="space-y-2">
        <h2 className="font-semibold text-base text-rose-200">Falha na conexão com a API</h2>
        <p className="text-rose-300/90 leading-relaxed">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 h-11 px-4 rounded-xl border border-rose-500/40 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold text-sm transition-colors active:scale-[0.98] cursor-pointer inline-flex items-center justify-center"
        >
          Tentar Novamente
        </button>
      </div>
    </div>
  );
}
