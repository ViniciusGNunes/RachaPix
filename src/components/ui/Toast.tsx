'use client';

import { useSyncExternalStore } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

const DURATION_MS = 3500;
let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const EMPTY: ToastItem[] = [];

function emit() {
  listeners.forEach((l) => l());
}

function dismiss(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

function push(kind: ToastKind, message: string) {
  const id = nextId++;
  items = [...items.slice(-2), { id, kind, message }];
  emit();
  if (typeof window !== 'undefined') window.setTimeout(() => dismiss(id), DURATION_MS);
}

export const toast = {
  success: (message: string) => push('success', message),
  error: (message: string) => push('error', message),
  info: (message: string) => push('info', message),
};

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

const styles: Record<ToastKind, string> = {
  success: 'border-emerald-500/25 bg-zinc-900/95 text-zinc-100 shadow-xl shadow-emerald-950/20',
  error: 'border-rose-500/25 bg-zinc-900/95 text-zinc-100 shadow-xl shadow-rose-950/20',
  info: 'border-zinc-800 bg-zinc-900/95 text-zinc-100 shadow-xl shadow-black/30',
};

const icons = {
  success: <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />,
  error: <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />,
  info: <Info className="w-5 h-5 shrink-0 text-accent" />,
};

export function Toaster() {
  const list = useSyncExternalStore(subscribe, () => items, () => EMPTY);

  return (
    <div
      aria-live="polite"
      role="status"
      className="pointer-events-none fixed inset-x-0 z-[100] flex flex-col items-center gap-2 px-4"
      style={{ top: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
    >
      {list.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border px-4 py-3 text-sm backdrop-blur-md cursor-pointer animate-toast-slide transition-all hover:scale-[1.01] ${styles[t.kind]}`}
          onClick={() => dismiss(t.id)}
        >
          {icons[t.kind]}
          <span className="min-w-0 break-words font-medium">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
