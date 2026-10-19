import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  LEGAL_TERMS_CLAUSES,
  EMAIL_CONTATO,
  PROJECT_NOTE,
  SUPPLIER_NAME,
  LAST_UPDATED,
} from '@/lib/legal';
import { ArrowLeft, FileText, Building2, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Termos de Uso — RachaConta',
  description:
    'Aviso legal e termos de uso da plataforma RachaConta para cálculo e divisão de despesas.',
};

export default function TermosPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 lg:pt-8 pb-16 w-full animate-fade-up">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-50 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar ao início
        </Link>
        <div className="flex items-center gap-2.5 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
          <FileText className="w-4 h-4" />
          Documento Legal
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-50">
          Aviso legal e termos de uso
        </h1>
        <p className="text-sm text-zinc-400 mt-2">
          Última atualização: {LAST_UPDATED}
        </p>
      </div>

      <div className="space-y-8">
        {/* Identificação do Fornecedor */}
        <section className="p-5 sm:p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <Building2 className="w-4 h-4 text-accent" />
            Identificação do Fornecedor / Serviço
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-300">
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
              <span className="block text-zinc-500 font-medium mb-0.5">Nome / Serviço</span>
              <span className="font-semibold text-zinc-200">{SUPPLIER_NAME}</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center gap-2">
              <Mail className="w-4 h-4 text-zinc-500 shrink-0" />
              <div>
                <span className="block text-zinc-500 font-medium mb-0.5">E-mail de contato</span>
                <a
                  href={`mailto:${EMAIL_CONTATO}`}
                  className="text-accent hover:underline font-medium"
                >
                  {EMAIL_CONTATO}
                </a>
              </div>
            </div>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">{PROJECT_NOTE}</p>
        </section>

        {/* Cláusulas numeradas */}
        <section className="p-5 sm:p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-6">
          <ol className="space-y-6">
            {LEGAL_TERMS_CLAUSES.map((clause) => (
              <li
                key={clause.number}
                className="space-y-1.5"
              >
                <div className="flex items-baseline gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 border border-accent/30 text-xs font-bold text-accent">
                    {clause.number}
                  </span>
                  <h2 className="text-base font-semibold text-zinc-100">
                    {clause.title}
                  </h2>
                </div>
                <p className="text-sm leading-relaxed text-zinc-300 pl-8">
                  {clause.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* Links relacionados */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 text-xs text-zinc-400">
          <span>
            Dúvidas sobre o tratamento de dados pessoais? Consulte nossa política.
          </span>
          <Link
            href="/privacidade"
            className="text-accent font-semibold hover:underline shrink-0"
          >
            Ver Política de Privacidade &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
