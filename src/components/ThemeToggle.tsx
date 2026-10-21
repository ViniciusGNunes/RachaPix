'use client';

import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

function readTheme(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'light' || v === 'dark') return v;
    if (v === 'system') {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {}

  if (typeof document !== 'undefined') {
    const currentAttr = document.documentElement.dataset.theme;
    if (currentAttr === 'light' || currentAttr === 'dark') {
      return currentAttr;
    }
  }

  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  return 'dark';
}

function enableThemeTransition() {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.add('theme-transition');
  window.setTimeout(() => {
    document.documentElement.classList.remove('theme-transition');
  }, 250);
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((m) => m.setAttribute('content', theme === 'dark' ? '#0b0f14' : '#f6f8fb'));
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = readTheme();
    setTheme(initial);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Se o usuário tem preferência salva (light|dark), ela prevalece.
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') return;
    } catch {}

    // Sem preferência salva: acompanha a preferência do sistema até escolha explícita.
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') return;
      } catch {}
      const next: Theme = e.matches ? 'dark' : 'light';
      enableThemeTransition();
      setTheme(next);
      applyTheme(next);
    };

    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [mounted]);

  const handleSelect = (next: Theme) => {
    if (next === theme) return;
    enableThemeTransition();
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  };

  const isLight = theme === 'light';
  const isDark = theme === 'dark';

  return (
    <fieldset
      aria-label="Tema"
      className="m-0 inline-flex items-center p-0.5 rounded-md bg-zinc-900 border border-zinc-800 shrink-0"
    >
      <button
        type="button"
        onClick={() => handleSelect('light')}
        aria-pressed={isLight}
        aria-label="Tema claro"
        title="Tema claro"
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer ${
          isLight
            ? 'bg-zinc-800 text-zinc-100 font-medium'
            : 'text-zinc-400 hover:text-zinc-200'
        }`}
        suppressHydrationWarning
      >
        <Sun className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Claro</span>
      </button>

      <button
        type="button"
        onClick={() => handleSelect('dark')}
        aria-pressed={isDark}
        aria-label="Tema escuro"
        title="Tema escuro"
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer ${
          isDark
            ? 'bg-zinc-800 text-zinc-100 font-medium'
            : 'text-zinc-400 hover:text-zinc-200'
        }`}
        suppressHydrationWarning
      >
        <Moon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Escuro</span>
      </button>
    </fieldset>
  );
}
