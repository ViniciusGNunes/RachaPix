'use client';

import React, { useEffect, useRef, useState } from 'react';

interface MoneyProps {
  value: number;
  /** Mostra "+" / "−" na frente e colore (verde positivo, vermelho negativo). */
  signed?: boolean;
  /** Anima de 0 até o valor ao montar. */
  animate?: boolean;
  className?: string;
}

const nf = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Valor monetário estilo app financeiro calmo: "R$" em proporção refinada, inteiros nítidos, centavos alinhados. */
export function Money({ value, signed = false, animate = false, className = '' }: Readonly<MoneyProps>) {
  const [shown, setShown] = useState(animate ? 0 : value);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(value);
      return;
    }
    const start = performance.now();
    const duration = 400;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out cubic
      const eased = 1 - (1 - t) ** 3;
      setShown(value * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value, animate]);

  const abs = Math.abs(shown);
  const [int, cents] = nf.format(abs).split(',');
  const negative = value < 0;
  const sign = negative ? '− ' : signed && value > 0 ? '+ ' : '';
  let tone = '';
  if (signed) {
    if (negative) tone = 'text-rose-400';
    else if (value > 0) tone = 'text-emerald-400';
  }

  return (
    <span className={`tabular-nums font-sans tracking-tight whitespace-nowrap ${tone} ${className}`}>
      <span className="text-[1.25em] font-semibold leading-none">
        {sign}
        <span className="text-[0.62em] font-medium mr-[0.18em] opacity-80">R$</span>
        <span>{int}</span>
        <span className="text-[0.72em] font-medium opacity-90">,{cents}</span>
      </span>
    </span>
  );
}
