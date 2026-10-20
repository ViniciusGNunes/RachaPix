'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { StatsDto } from '@/lib/api';
import { Money } from '@/components/ui/Money';
import { useIsMobile } from '@/lib/useIsMobile';
import { formatBRL, CATEGORY_LABELS } from '@/lib/formatters';

interface StatsChartsProps {
  stats: StatsDto;
}

const COLORS = [
  'var(--accent)',
  'var(--color-blue-400)',
  'var(--color-purple-400)',
  'var(--color-amber-400)',
  'var(--color-rose-400)',
  'var(--color-emerald-400)',
  'var(--color-blue-300)',
  'var(--color-emerald-300)',
  'var(--color-rose-300)',
  'var(--color-zinc-400)',
];

const AXIS_TICK = { fontSize: 11, fill: 'var(--color-zinc-400)' };
const AXIS_LINE = { stroke: 'var(--color-zinc-800)' };
const TOOLTIP_STYLE = {
  backgroundColor: 'var(--color-zinc-900)',
  border: '1px solid var(--color-zinc-700)',
  borderRadius: 12,
  padding: '8px 12px',
  fontSize: 12,
  color: 'var(--color-zinc-50)',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
};
const TOOLTIP_PROPS = {
  contentStyle: TOOLTIP_STYLE,
  labelStyle: { color: 'var(--color-zinc-400)', fontWeight: 500, marginBottom: 4 },
  itemStyle: { color: 'var(--color-zinc-50)' },
  cursor: { fill: 'rgba(255, 255, 255, 0.03)' },
};

interface BarRow {
  label: string;
  value: number;
  color: string;
}

function BarList({ rows }: Readonly<{ rows: BarRow[] }>) {
  const total = rows.reduce((acc, r) => acc + r.value, 0);
  const max = rows.reduce((acc, r) => Math.max(acc, r.value), 0);
  return (
    <ul className="space-y-3.5 my-auto py-2">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 min-w-0 text-zinc-200">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
              <span className="truncate">{r.label}</span>
            </span>
            <span className="tabular-nums text-zinc-50 font-semibold shrink-0">
              <Money value={r.value} />
              {total > 0 && (
                <span className="text-zinc-400 font-normal text-xs ml-1.5">
                  {Math.round((r.value / total) * 100)}%
                </span>
              )}
            </span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-zinc-800/80 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${max > 0 ? (r.value / max) * 100 : 0}%`, backgroundColor: r.color }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function ChartSlot({
  empty,
  emptyText,
  isMobile,
  mobile,
  desktop,
}: Readonly<{
  empty: boolean;
  emptyText: string;
  isMobile: boolean;
  mobile: React.ReactNode;
  desktop: React.ReactNode;
}>) {
  if (empty) {
    return <p className="text-xs text-zinc-400 my-auto text-center py-10">{emptyText}</p>;
  }
  return <>{isMobile ? mobile : desktop}</>;
}

export function StatsCharts({ stats }: Readonly<StatsChartsProps>) {
  const isMobile = useIsMobile();
  // Format data for Category Pie Chart
  const categoryData = (stats.byCategory || []).map((c) => ({
    name: CATEGORY_LABELS[c.category] || c.category,
    value: c.total,
  }));

  // Format data for Member Comparison Chart
  const memberData = (stats.byMember || []).map((m) => ({
    name: m.name,
    Pago: m.paid,
    Devido: m.owed,
  }));

  // Format data for Monthly Timeline
  const monthData = (stats.byMonth || []).map((m) => ({
    month: m.month,
    total: m.total,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full">
      {/* Chart 1: Gastos por Categoria */}
      <div className="bg-zinc-900/40 p-5 sm:p-6 rounded-2xl border border-zinc-800/80 flex flex-col shadow-sm">
        <h3 className="font-semibold text-zinc-50 text-base mb-4 tracking-tight">
          Gastos por Categoria
        </h3>
        <ChartSlot
          empty={categoryData.length === 0}
          emptyText="Nenhuma despesa para exibir no período."
          isMobile={isMobile}
          mobile={(
          <BarList rows={categoryData.map((c, i) => ({ label: c.name, value: c.value, color: COLORS[i % COLORS.length] }))} />
          )}
          desktop={(
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((d, index) => (
                    <Cell key={d.name} stroke="var(--color-zinc-950)" fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...TOOLTIP_PROPS}
                  formatter={(value: unknown) => [formatBRL(Number(value) || 0), 'Total']}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', color: 'var(--color-zinc-400)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          )}
        />
      </div>

      {/* Chart 3: Comparativo Pago vs Devido por Membro */}
      <div className="bg-zinc-900/40 p-5 sm:p-6 rounded-2xl border border-zinc-800/80 flex flex-col shadow-sm">
        <h3 className="font-semibold text-zinc-50 text-base mb-4 tracking-tight">
          Comparativo por Membro (Pago vs Devido)
        </h3>
        <ChartSlot
          empty={memberData.every((m) => m.Pago === 0 && m.Devido === 0)}
          emptyText="Nenhum membro com despesas no período."
          isMobile={isMobile}
          mobile={(
          <ul className="space-y-4 my-auto py-2">
            {memberData.map((m) => {
              const max = Math.max(m.Pago, m.Devido, 0.01);
              return (
                <li key={m.name} className="space-y-1.5">
                  <p className="text-sm font-semibold text-zinc-200 truncate">{m.name}</p>
                  {([['Pago', m.Pago, 'var(--accent)'], ['Devido', m.Devido, 'var(--color-amber-400)']] as const).map(([lbl, val, color]) => (
                    <div key={lbl}>
                      <div className="flex justify-between text-xs text-zinc-400">
                        <span>{lbl}</span>
                        <span className="tabular-nums text-zinc-200"><Money value={val} /></span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-zinc-800/80 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(val / max) * 100}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  ))}
                </li>
              );
            })}
          </ul>
          )}
          desktop={(
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val}`} />
                <Tooltip {...TOOLTIP_PROPS} formatter={(value: unknown) => [formatBRL(Number(value) || 0)]} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', color: 'var(--color-zinc-400)' }} />
                <Bar dataKey="Pago" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Devido" fill="var(--color-amber-400)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          )}
        />
      </div>

      {/* Chart 3: Evolução Mensal */}
      <div className="bg-zinc-900/40 p-5 sm:p-6 rounded-2xl border border-zinc-800/80 flex flex-col shadow-sm md:col-span-2">
        <h3 className="font-semibold text-zinc-50 text-base mb-4 tracking-tight">
          Gastos por Mês
        </h3>
        <ChartSlot
          empty={monthData.length === 0}
          emptyText="Nenhum dado mensal registrado."
          isMobile={isMobile}
          mobile={(
          <BarList rows={monthData.map((m) => ({ label: m.month, value: m.total, color: 'var(--accent)' }))} />
          )}
          desktop={(
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val}`} />
                <Tooltip
                  {...TOOLTIP_PROPS}
                  cursor={{ stroke: 'var(--color-zinc-700)' }}
                  formatter={(value: unknown) => [formatBRL(Number(value) || 0), 'Total gasto']}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  fill="var(--accent)"
                  fillOpacity={0.15}
                  activeDot={{ r: 4, fill: 'var(--accent)', stroke: 'var(--color-zinc-950)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          )}
        />
      </div>
    </div>
  );
}
