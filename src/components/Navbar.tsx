'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, PlusCircle, Home } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogoMark } from '@/components/Logo';

const navLinks = [
  { href: '/', label: 'Início', icon: Home, exact: true },
  { href: '/rachar', label: 'Dividir conta', icon: PlusCircle },
  { href: '/despesas', label: 'Grupos', icon: Users },
];

export function Navbar() {
  const pathname = usePathname();

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href || pathname === `${href}/`;
    return pathname.startsWith(href);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 md:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg md:text-xl text-zinc-50 group">
            <LogoMark className="w-8 h-8 md:w-9 md:h-9 transition-transform group-hover:scale-105" />
            <span className="font-brand text-2xl md:text-[1.65rem] font-bold tracking-[0.04em] text-zinc-100">
              Racha<span className="text-accent">Conta</span>
              <span className="cursor-blink text-accent">_</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <nav className="hidden md:flex items-center gap-1.5" aria-label="Principal">
              {navLinks.map(({ href, label, icon: Icon, exact }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive(href, exact)
                      ? 'bg-accent-muted text-accent font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile: barra de abas fixa embaixo (alcance do polegar) */}
      <nav
        aria-label="Principal"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="grid grid-cols-3">
          {navLinks.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex flex-col items-center justify-center gap-1 h-16 text-xs font-medium transition-colors active:scale-95 ${
                    active ? 'text-accent font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'stroke-[2.25]' : 'stroke-[1.75]'}`} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
