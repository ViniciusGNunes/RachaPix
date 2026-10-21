'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'lg',
}: Readonly<ModalProps>) {
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement as HTMLElement | null;

    const focusTimer = setTimeout(() => {
      if (modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length > 0) {
          focusables[0].focus();
        } else {
          modalRef.current.focus();
        }
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusables = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el.offsetParent !== null);

        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables.at(-1)!;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
      previousActiveElement.current?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 animate-fade-in sm:overflow-y-auto">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Fechar clicando fora"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
      />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative w-full ${maxWidthClasses} bg-zinc-950 rounded-t-lg sm:rounded-lg border border-zinc-800 overflow-hidden max-h-[92dvh] sm:max-h-none flex flex-col animate-sheet-up sm:animate-modal-pop shadow-sm sm:my-8`}
      >
        <div className="sm:hidden mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-zinc-700" aria-hidden="true" />
        <div className="flex items-start justify-between p-3.5 sm:p-4 border-b border-zinc-800 shrink-0">
          <div>
            <h2 id="modal-title" className="text-lg sm:text-xl font-semibold text-zinc-50 tracking-tight">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-xs sm:text-sm text-zinc-400">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -mr-1 text-zinc-400 hover:text-zinc-200 rounded-md hover:bg-zinc-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 sm:max-h-[80vh] overflow-y-auto pb-[calc(1rem+env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>
  );
}
