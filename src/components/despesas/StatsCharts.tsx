'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { StatsDto } from '@/lib/api';
import { formatBRL, CATEGORY_LABELS, PAYMENT_METHOD_LABELS } from '@/lib/formatters';

interface StatsChartsProps {
  stats: StatsDto;
}

const COLORS = [
  '#fafafa',
  '#a1a1aa',
  '#52525b',
  '#34d399',
  '#fbbf24',
  '#fb7185',
  '#60a5fa',
  '#c084fc',
  '#2dd4bf',
  '#3f3f46',
];

const AXIS_TICK = { fontSize: 11, fill: '#a1a1aa' };
const AXIS_LINE = { stroke: '#27272a' };
const TOOLTIP_STYLE = {
  backgroundColor: '#09090b',
  border: '1px solid #27272a',
  borderRadius: 8,
  fontSize: 12,
  color: '#fafafa',
};
const TOOLTIP_PROPS = {
  contentStyle: TOOLTIP_STYLE,
  labelStyle: { color: '#a1a1aa' },
  itemStyle: { color: '#fafafa' },
  cursor: { fill: 'rgba(250,250,250,0.04)' },
};

export function StatsCharts({ stats }: StatsChartsProps) {
  // Format data for Category Pie Chart
  const categoryData = (stats.byCategory || []).map((c) => ({
    name: CATEGORY_LABELS[c.category] || c.category,
    value: c.total,
  }));

  // Format data for Payment Method Bar Chart
  const paymentData = (stats.byPaymentMethod || []).map((p) => ({
    name: PAYMENT_METHOD_LABELS[p.paymentMethod] || p.paymentMethod,
    total: p.total,
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      {/* Chart 1: Gastos por Categoria */}
      <div className=" bg-zinc-950 p-6 rounded-xl border border-zinc-800 flex flex-col">
        <h3 className="font-bold text-white text-base mb-4">
          Gastos por Categoria
        </h3>
        {categoryData.length === 0 ? (
          <p className="text-xs text-zinc-500 my-auto text-center py-10">
            Nenhuma despesa para exibir no período.
          </p>
        ) : (
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
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} stroke="#09090b" fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...TOOLTIP_PROPS}
                  formatter={(value: unknown) => [formatBRL(Number(value) || 0), 'Total']}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#a1a1aa' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Chart 2: Gastos por Forma de Pagamento */}
      <div className=" bg-zinc-950 p-6 rounded-xl border border-zinc-800 flex flex-col">
        <h3 className="font-bold text-white text-base mb-4">
          Formas de Pagamento
        </h3>
        {paymentData.length === 0 ? (
          <p className="text-xs text-zinc-500 my-auto text-center py-10">
            Nenhuma despesa para exibir no período.
          </p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} interval={0} angle={-25} textAnchor="end" />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val}`} />
                <Tooltip {...TOOLTIP_PROPS} formatter={(value: unknown) => [formatBRL(Number(value) || 0), 'Total']} />
                <Bar dataKey="total" fill="#fafafa" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Chart 3: Comparativo Pago vs Devido por Membro */}
      <div className=" bg-zinc-950 p-6 rounded-xl border border-zinc-800 flex flex-col">
        <h3 className="font-bold text-white text-base mb-4">
          Comparativo por Membro (Pago vs Devido)
        </h3>
        {memberData.length === 0 ? (
          <p className="text-xs text-zinc-500 my-auto text-center py-10">
            Nenhum membro com despesas no período.
          </p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val}`} />
                <Tooltip {...TOOLTIP_PROPS} formatter={(value: unknown) => [formatBRL(Number(value) || 0)]} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#a1a1aa' }} />
                <Bar dataKey="Pago" fill="#fafafa" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Devido" fill="#52525b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Chart 4: Evolução Mensal */}
      <div className=" bg-zinc-950 p-6 rounded-xl border border-zinc-800 flex flex-col">
        <h3 className="font-bold text-white text-base mb-4">
          Gastos por Mês
        </h3>
        {monthData.length === 0 ? (
          <p className="text-xs text-zinc-500 my-auto text-center py-10">
            Nenhum dado mensal registrado.
          </p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val}`} />
                <Tooltip {...TOOLTIP_PROPS} formatter={(value: unknown) => [formatBRL(Number(value) || 0), 'Total Gasto']} />
                <Bar dataKey="total" fill="#a1a1aa" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
