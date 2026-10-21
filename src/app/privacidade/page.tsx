import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  EMAIL_CONTATO,
  PROJECT_NOTE,
  SUPPLIER_NAME,
  LAST_UPDATED,
} from '@/lib/legal';
import {
  ArrowLeft,
  Shield,
  Database,
  Target,
  Scale,
  HardDrive,
  Share2,
  Clock,
  UserCheck,
  Mail,
  Building2,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Política de Privacidade — RachaPix',
  description:
    'Política de privacidade e proteção de dados pessoais (LGPD) do RachaPix.',
};

export default function PrivacidadePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 lg:pt-8 pb-16 w-full animate-fade-up">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar ao início
        </Link>
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
          <Shield className="w-4 h-4" />
          Privacidade e Proteção de Dados (LGPD)
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-50">
          Política de Privacidade
        </h1>
        <p className="text-sm text-zinc-400 mt-1.5">
          Última atualização: {LAST_UPDATED}
        </p>
      </div>

      <div className="space-y-6">
        {/* Identificação do Controlador */}
        <section className="p-5 sm:p-6 rounded-lg bg-zinc-900 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <Building2 className="w-4 h-4 text-accent" />
            Controlador dos Dados Pessoais
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-300">
            <div className="p-3 rounded-md bg-zinc-950/60 border border-zinc-800/80">
              <span className="block text-zinc-400 font-medium mb-0.5">Controlador / Serviço</span>
              <span className="font-semibold text-zinc-200">{SUPPLIER_NAME}</span>
            </div>
            <div className="p-3 rounded-md bg-zinc-950/60 border border-zinc-800/80 flex items-center gap-2">
              <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
              <div>
                <span className="block text-zinc-400 font-medium mb-0.5">Encarregado / Contato DPO</span>
                <a
                  href={`mailto:${EMAIL_CONTATO}`}
                  className="text-accent hover:underline font-medium"
                >
                  {EMAIL_CONTATO}
                </a>
              </div>
            </div>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">{PROJECT_NOTE}</p>
        </section>

        {/* 1. Dados Coletados */}
        <section className="p-5 sm:p-6 rounded-lg bg-zinc-900 border border-zinc-800 space-y-3">
          <div className="flex items-center gap-2 text-base font-semibold text-zinc-100">
            <Database className="w-4 h-4 text-accent" />
            1. Dados Coletados
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            O RachaPix adota o princípio da minimização da coleta, solicitando estritamente os dados necessários para o cálculo das divisões e geração das cobranças Pix solicitadas pelo usuário:
          </p>
          <ul className="list-disc list-inside text-sm text-zinc-300 space-y-1.5 pl-2 leading-relaxed">
            <li><strong className="text-zinc-100">Nomes:</strong> nome ou apelido dos participantes da divisão ou membros do grupo;</li>
            <li><strong className="text-zinc-100">Chaves Pix:</strong> chave Pix informada pelo organizador ou membro para recebimento (e-mail, telefone, CPF, CNPJ ou chave aleatória EVP);</li>
            <li><strong className="text-zinc-100">Valores e despesas:</strong> quantias totais e individuais a serem divididas, datas e descrições dos gastos;</li>
            <li><strong className="text-zinc-100">Dados do grupo:</strong> título da divisão ou do grupo de despesas e notas informadas pelos usuários.</li>
          </ul>
          <p className="text-xs text-zinc-400 pt-1">
            Não coletamos senhas bancárias, dados de cartão de crédito/débito, biometria ou dados cadastrais sensíveis.
          </p>
        </section>

        {/* 2. Finalidade do Tratamento */}
        <section className="p-5 sm:p-6 rounded-lg bg-zinc-900 border border-zinc-800 space-y-3">
          <div className="flex items-center gap-2 text-base font-semibold text-zinc-100">
            <Target className="w-4 h-4 text-accent" />
            2. Finalidade do Tratamento
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Os dados pessoais tratados são utilizados exclusivamente para as seguintes finalidades operacionais:
          </p>
          <ul className="list-disc list-inside text-sm text-zinc-300 space-y-1.5 pl-2 leading-relaxed">
            <li>Calcular e apresentar divisões de contas justas (iguais ou personalizadas);</li>
            <li>Gerar códigos Pix copia-e-cola e QR Codes no padrão EMV BR Code do Banco Central;</li>
            <li>Permitir o acompanhamento do status de pagamentos em divisões pontuais e grupos de despesas compartilhadas;</li>
            <li>Emitir resumos e comprovantes simplificados de conferência para os participantes.</li>
          </ul>
        </section>

        {/* 3. Base Legal (LGPD) */}
        <section className="p-5 sm:p-6 rounded-lg bg-zinc-900 border border-zinc-800 space-y-3">
          <div className="flex items-center gap-2 text-base font-semibold text-zinc-100">
            <Scale className="w-4 h-4 text-accent" />
            3. Base Legal (Art. 7º da LGPD)
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            O tratamento de dados pessoais no RachaPix encontra fundamento nos seguintes dispositivos da Lei nº 13.709/2018 (LGPD):
          </p>
          <ul className="list-disc list-inside text-sm text-zinc-300 space-y-1.5 pl-2 leading-relaxed">
            <li><strong className="text-zinc-100">Art. 7º, inciso V:</strong> execução de contrato ou de procedimentos preliminares relacionados ao serviço expressamente solicitado pelo titular;</li>
            <li><strong className="text-zinc-100">Art. 7º, inciso IX:</strong> atendimento aos interesses legítimos do controlador e dos titulares para a correta organização das despesas e prestação do suporte.</li>
          </ul>
        </section>

        {/* 4. Armazenamento (Servidor e Browser) */}
        <section className="p-5 sm:p-6 rounded-lg bg-zinc-900 border border-zinc-800 space-y-3">
          <div className="flex items-center gap-2 text-base font-semibold text-zinc-100">
            <HardDrive className="w-4 h-4 text-accent" />
            4. Armazenamento dos Dados
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Os dados são armazenados de forma híbrida e segura:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-300 pt-1">
            <div className="p-3.5 rounded-md bg-zinc-950/60 border border-zinc-800 space-y-1">
              <span className="font-semibold text-zinc-100 block">No Servidor</span>
              <p className="text-zinc-400 leading-relaxed">
                Armazenamento em banco de dados seguro para permitir o acesso compartilhado aos participantes via links criptografados/tokens de acesso.
              </p>
            </div>
            <div className="p-3.5 rounded-md bg-zinc-950/60 border border-zinc-800 space-y-1">
              <span className="font-semibold text-zinc-100 block">No Navegador (localStorage)</span>
              <p className="text-zinc-400 leading-relaxed">
                Armazenamento local no dispositivo do usuário para preferências de tema, atalhos de rachas e grupos recentes, cidade padrão e registro de aceite dos termos (<code className="font-mono text-zinc-300">rc_terms_accepted</code>).
              </p>
            </div>
          </div>
        </section>

        {/* 5. Compartilhamento */}
        <section className="p-5 sm:p-6 rounded-lg bg-zinc-900 border border-zinc-800 space-y-3">
          <div className="flex items-center gap-2 text-base font-semibold text-zinc-100">
            <Share2 className="w-4 h-4 text-accent" />
            5. Compartilhamento de Dados
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            <strong className="text-zinc-100">Não vendemos, não alugamos e não compartilhamos</strong> seus dados pessoais com anunciantes, terceiros ou corretores de dados.
          </p>
          <p className="text-sm text-zinc-300 leading-relaxed">
            O compartilhamento de informações sobre o racha (como títulos, participantes e chave Pix para pagamento) ocorre <strong className="text-zinc-100">exclusivamente por meio dos links que o próprio usuário decide compartilhar</strong> com os membros do seu grupo ou participantes da divisão.
          </p>
        </section>

        {/* 6. Retenção e Exclusão */}
        <section className="p-5 sm:p-6 rounded-lg bg-zinc-900 border border-zinc-800 space-y-3">
          <div className="flex items-center gap-2 text-base font-semibold text-zinc-100">
            <Clock className="w-4 h-4 text-accent" />
            6. Retenção e Exclusão
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Os dados são mantidos enquanto a divisão ou grupo estiver em uso. O criador do grupo ou racha pode excluir registros diretamente pela interface ou solicitar a exclusão integral entrando em contato pelo e-mail{' '}
            <a href={`mailto:${EMAIL_CONTATO}`} className="text-accent hover:underline font-medium">
              {EMAIL_CONTATO}
            </a>. Dados armazenados localmente no navegador podem ser apagados pelo usuário a qualquer momento limpando os dados de navegação.
          </p>
        </section>

        {/* 7. Direitos do Titular (Art. 18 da LGPD) */}
        <section className="p-5 sm:p-6 rounded-lg bg-zinc-900 border border-zinc-800 space-y-3">
          <div className="flex items-center gap-2 text-base font-semibold text-zinc-100">
            <UserCheck className="w-4 h-4 text-accent" />
            7. Seus Direitos (Art. 18 da LGPD)
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Conforme previsto no Art. 18 da LGPD, você possui os seguintes direitos em relação aos seus dados pessoais:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300 pt-1">
            <li className="p-2.5 rounded-md bg-zinc-950/60 border border-zinc-800/80">
              <strong className="text-zinc-100 block">Confirmação e Acesso:</strong> confirmar a existência de tratamento e acessar seus dados;
            </li>
            <li className="p-2.5 rounded-md bg-zinc-950/60 border border-zinc-800/80">
              <strong className="text-zinc-100 block">Correção:</strong> retificar dados incompletos, inexatos ou desatualizados;
            </li>
            <li className="p-2.5 rounded-md bg-zinc-950/60 border border-zinc-800/80">
              <strong className="text-zinc-100 block">Anonimização ou Eliminação:</strong> solicitar anonimização, bloqueio ou eliminação de dados desnecessários;
            </li>
            <li className="p-2.5 rounded-md bg-zinc-950/60 border border-zinc-800/80">
              <strong className="text-zinc-100 block">Portabilidade:</strong> requerer a portabilidade das suas informações;
            </li>
            <li className="p-2.5 rounded-md bg-zinc-950/60 border border-zinc-800/80">
              <strong className="text-zinc-100 block">Informação sobre Compartilhamento:</strong> consultar com quem as informações são compartilhadas;
            </li>
            <li className="p-2.5 rounded-md bg-zinc-950/60 border border-zinc-800/80">
              <strong className="text-zinc-100 block">Revogação do Consentimento:</strong> revogar consentimentos previamente concedidos.
            </li>
          </ul>
        </section>

        {/* 8. Contato do Encarregado */}
        <section className="p-5 sm:p-6 rounded-lg bg-zinc-900 border border-zinc-800 space-y-3">
          <div className="flex items-center gap-2 text-base font-semibold text-zinc-100">
            <Mail className="w-4 h-4 text-accent" />
            8. Canal de Contato
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Para exercer quaisquer dos seus direitos ou esclarecer dúvidas sobre esta Política de Privacidade, entre em contato diretamente com o nosso canal de privacidade:
          </p>
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-zinc-950 border border-zinc-800 text-sm">
            <Mail className="w-4 h-4 text-accent" />
            <a
              href={`mailto:${EMAIL_CONTATO}`}
              className="text-zinc-100 font-semibold hover:text-accent transition-colors"
            >
              {EMAIL_CONTATO}
            </a>
          </div>
        </section>

        {/* Links relacionados */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
          <span>
            Leia também nossos termos de uso e condições gerais da plataforma.
          </span>
          <Link
            href="/termos"
            className="text-accent font-semibold hover:underline shrink-0"
          >
            Ver Termos de Uso &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
