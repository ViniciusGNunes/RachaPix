import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center animate-fade-up">
      <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/30 flex items-center justify-center mx-auto mb-3.5">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-50 mb-2">Página não encontrada</h1>
      <p className="text-zinc-400 text-sm mb-6 leading-relaxed">O endereço que você acessou não existe.</p>
      <Link
        href="/"
        className="inline-flex items-center justify-center h-10 sm:h-9 px-4 bg-accent text-accent-fg rounded-md text-sm font-medium hover:bg-accent-hover transition-colors shadow-sm"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
