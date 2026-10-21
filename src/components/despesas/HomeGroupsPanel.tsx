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
      className="flex flex-col gap-6 rounded-lg border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6 lg:p-8"
    >
      <div className="space-y-4">
        <div className="w-10 h-10 rounded-md bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-200">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            República, viagem, amigos
          </p>
          <h2
            id="home-groups-title"
            className="mt-1.5 text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-50"
          >
            Grupos de despesas
          </h2>
          <p className="mt-2 text-sm sm:text-base text-zinc-400 leading-relaxed max-w-xl">
            Despesas contínuas num só lugar: registre os gastos e veja quem paga quem, sem planilha.
          </p>
        </div>
        <div>
          <Link
            href="/despesas"
            className="group h-10 sm:h-9 px-4 rounded-md bg-zinc-100 text-zinc-950 hover:bg-white text-sm font-semibold transition-all active:scale-[0.99] inline-flex items-center justify-between gap-4 cursor-pointer"
          >
            Abrir meus grupos
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      <ul className="divide-y divide-zinc-800 border-y border-zinc-800">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <li key={title} className="py-2.5 sm:py-3 flex items-start gap-3">
            <Icon className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-100">{title}</p>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{text}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-auto space-y-4">
        {savedGroups.length > 0 ? (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-zinc-400">Seus grupos</h3>
              <span className="text-xs text-zinc-400">Salvos neste navegador</span>
            </div>
            <div className="rounded-md border border-zinc-800 divide-y divide-zinc-800 overflow-hidden">
              {savedGroups.slice(0, 6).map((group) => (
                <Link
                  key={group.id}
                  href={groupPath(group.id)}
                  className="py-2 px-3 flex items-center gap-3 hover:bg-zinc-800/40 transition-colors cursor-pointer"
                >
                  <span className="w-7 h-7 rounded-full bg-accent/15 text-accent border border-accent/30 font-semibold flex items-center justify-center text-xs shrink-0">
                    {(group.name ?? 'G').charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-medium text-zinc-100 truncate">
                    {group.name ?? 'Grupo sem nome'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-zinc-400 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-zinc-800 p-4 text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Nenhum grupo salvo neste navegador ainda. Crie um e convide todos por link.
          </div>
        )}
      </div>
    </section>
  );
}
