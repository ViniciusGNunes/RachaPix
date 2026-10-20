'use client';

import React, { useEffect, useState, useCallback, useId } from 'react';
import Link from 'next/link';
import { SHORT_LEGAL_NOTICE } from '@/lib/legal';
import { ShieldCheck, Info } from 'lucide-react';

export const TERMS_STORAGE_KEY = 'rc_terms_accepted';
const TERMS_CHANGE_EVENT = 'rc-terms-accepted-change';

/**
 * Hook SSR-safe para consultar e atualizar o aceite dos termos pelo usuário.
 * Armazenado em localStorage sob a chave 'rc_terms_accepted'.
 */
export function useTermsAccepted(): {
  accepted: boolean;
  setAccepted: (val: boolean) => void;
  acceptTerms: () => void;
  isReady: boolean;
} {
  const [acceptedState, setAcceptedState] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    let current = false;
    try {
      if (typeof window !== 'undefined') {
        current = window.localStorage.getItem(TERMS_STORAGE_KEY) === 'true';
      }
    } catch {
      // Falha ao acessar localStorage (ex: modo privado estrito)
      current = false;
    }
    setAcceptedState(current);
    setIsReady(true);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === TERMS_STORAGE_KEY) {
        setAcceptedState(e.newValue === 'true');
      }
    };

    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      if (typeof customEvent.detail === 'boolean') {
        setAcceptedState(customEvent.detail);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(TERMS_CHANGE_EVENT, handleCustomChange);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(TERMS_CHANGE_EVENT, handleCustomChange);
    };
  }, []);

  const setAccepted = useCallback((val: boolean) => {
    setAcceptedState(val);
    try {
      if (typeof window !== 'undefined') {
        if (val) {
          window.localStorage.setItem(TERMS_STORAGE_KEY, 'true');
        } else {
          window.localStorage.removeItem(TERMS_STORAGE_KEY);
        }
        window.dispatchEvent(
          new CustomEvent<boolean>(TERMS_CHANGE_EVENT, { detail: val })
        );
      }
    } catch {
      // Ignora erro de gravação em storage
    }
  }, []);

  const acceptTerms = useCallback(() => {
    setAccepted(true);
  }, [setAccepted]);

  return { accepted: acceptedState, setAccepted, acceptTerms, isReady };
}

/**
 * Aviso curto regulatório obrigatório em pontos de geração/visualização de Pix.
 */
export function TermsShortNotice({ className = '' }: Readonly<{ className?: string }>) {
  return (
    <div
      role="note"
      className={`rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3 text-xs leading-relaxed text-zinc-400 flex items-start gap-2.5 ${className}`}
    >
      <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" aria-hidden="true" />
      <span>{SHORT_LEGAL_NOTICE}</span>
    </div>
  );
}

interface TermsConsentCheckboxProps {
  className?: string;
  id?: string;
  disabled?: boolean;
}

/**
 * Checkbox de aceite obrigatório dos Termos de Uso e Política de Privacidade.
 * Os links abrem em nova aba com rel="noopener noreferrer".
 */
export function TermsConsentCheckbox({
  className = '',
  id: customId,
  disabled = false,
}: Readonly<TermsConsentCheckboxProps>) {
  const generatedId = useId();
  const inputId = customId || `terms-consent-${generatedId}`;
  const { accepted, setAccepted, isReady } = useTermsAccepted();

  return (
    <label
      htmlFor={inputId}
      className={`flex items-start gap-2.5 text-xs text-zinc-300 select-none cursor-pointer group ${
        disabled ? 'opacity-60 pointer-events-none' : ''
      } ${className}`}
    >
      <input
        id={inputId}
        type="checkbox"
        checked={isReady && accepted}
        onChange={(e) => setAccepted(e.target.checked)}
        disabled={disabled}
        className="mt-0.5 h-4 w-4 min-h-0 shrink-0 appearance-none rounded-[3px] border border-zinc-600 bg-zinc-950 bg-center bg-no-repeat cursor-pointer transition-colors checked:border-accent checked:bg-accent checked:bg-[url('data:image/svg+xml;utf8,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2016%2016%22%20fill=%22none%22%20stroke=%22white%22%20stroke-width=%222.5%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22><path%20d=%22M3.5%208.5l3%203%206-7%22/></svg>')] focus:shadow-none! focus:ring-0! focus:outline-none! focus:border-zinc-600! checked:focus:border-accent!"
      />
      <span className="leading-snug">
        Li e aceito os{' '}
        <Link
          href="/termos"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline underline-offset-2 hover:text-accent-hover font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          Termos de Uso
        </Link>{' '}
        e a{' '}
        <Link
          href="/privacidade"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline underline-offset-2 hover:text-accent-hover font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          Política de Privacidade
        </Link>
        .
      </span>
    </label>
  );
}

interface TermsConsentBlockProps {
  className?: string;
  id?: string;
  disabled?: boolean;
}

/**
 * Bloco completo combinando o aviso curto e o checkbox de aceite.
 * Recomendado para pontos de conversão e geração de Pix.
 */
export function TermsConsentBlock({
  className = '',
  id,
  disabled,
}: Readonly<TermsConsentBlockProps>) {
  const { accepted, isReady } = useTermsAccepted();

  return (
    <div className={`space-y-2.5 ${className}`}>
      <TermsShortNotice />
      <div className="flex items-center justify-between gap-3 pt-0.5">
        <TermsConsentCheckbox id={id} disabled={disabled} />
        {isReady && accepted && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
            Termos aceitos
          </span>
        )}
      </div>
    </div>
  );
}
