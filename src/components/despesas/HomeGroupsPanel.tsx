import React from 'react';
import Link from 'next/link';
import { Users, ArrowRight, Scale, Route, Link2, BarChart3 } from 'lucide-react';
import type { SavedGroup } from '@/lib/storage';
import { groupPath } from '@/lib/routes';

interface HomeGroupsPanelProps {
  savedGroups: SavedGroup[];
}

const FEATURES = [
  { icon: Scale, title: 'Saldo de cada um', text: 'Quem deve e quem tem a receber, sempre atualizado.' },
  { icon: Route, title: 'Menos transferências', text: 'O menor número de Pix pra quitar tudo.' },
  { icon: Link2, title: 'Convite por link', text: 'Chame todo mundo e cada um escolhe quem é.' },
  { icon: BarChart3, title: 'Estatísticas', text: 'Gastos por categoria e por pessoa.' },
];

export function HomeGroupsPanel({ savedGroups }: HomeGroupsPanelProps) {
  return (
    <section
      aria-labelledby="home-groups-title"
      className="relative overflow-hidden flex flex-col gap-8 rounded-3xl border border-zinc-800/80 bg-gradient-to-br from-zinc-800/30 via-zinc-900/40 to-zinc-900/20 p-6 sm:p-10 lg:p-12"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-32 h-80 w-80 rounded-full bg-zinc-500/10 blur-3xl"
      />

      <div className="relative space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-200">
          <Users className="w-7 h-7" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
            República, viagem, amigos
          </p>
          <h2
            id="home-groups-title"
            className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-zinc-50"
          >
            Grupos de despesas
          </h2>
          <p className="mt-3 text-base sm:text-lg text-zinc-400 leading-relaxed max-w-xl">
            Despesas contínuas num só lugar: registre os gastos e veja quem paga quem, sem planilha.
          </p>
        </div>
        <Link
          href="/despesas"
          className="group h-14 px-6 rounded-2xl bg-zinc-100 text-zinc-950 hover:bg-white text-base font-semibold transition-all active:scale-[0.99] inline-flex items-center justify-between gap-6 cursor-pointer"
        >
          Abrir meus grupos
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <ul className="relative grid gap-3 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <li key={title} className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-4 space-y-2">
            <Icon className="w-5 h-5 text-accent" />
            <p className="text-sm font-semibold text-zinc-100">{title}</p>
            <p className="text-xs text-zinc-400 leading-relaxed">{text}</p>
          </li>
        ))}
      </ul>

      <div className="relative mt-auto">
        {savedGroups.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-medium text-zinc-400">Seus grupos</h3>
              <span className="text-xs text-zinc-500">Salvos neste navegador</span>
            </div>
            <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800/80 divide-y divide-zinc-800/80 overflow-hidden">
              {savedGroups.slice(0, 6).map((group) => (
                <Link
                  key={group.id}
                  href={groupPath(group.id)}
                  className="p-4 flex items-center gap-3 hover:bg-zinc-900/50 transition-colors cursor-pointer"
                >
                  <span className="w-9 h-9 rounded-full bg-accent/15 text-accent border border-accent/30 font-semibold flex items-center justify-center text-sm shrink-0">
                    {(group.name ?? 'G').charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-semibold text-zinc-100 truncate">
                    {group.name ?? 'Grupo sem nome'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-zinc-500 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-800 p-5 text-sm text-zinc-500 leading-relaxed">
            Nenhum grupo salvo neste navegador ainda. Crie um e convide todos por link.
          </div>
        )}
      </div>
    </section>
  );
}
