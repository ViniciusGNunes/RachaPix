/**
 * Constantes legais compartilhadas e textos institucionais / regulatórios.
 * Edite os valores abaixo conforme os dados da sua empresa ou operação.
 */
export const EMAIL_CONTATO = 'vini.gn14@gmail.com';
export const SUPPLIER_NAME = 'RachaPix';
export const LAST_UPDATED = '18/10/2026';

/**
 * Aviso curto obrigatório em pontos de conversão Pix e no rodapé.
 * Texto verbatim conforme scratchpad/termos.md.
 */
export const SHORT_LEGAL_NOTICE =
  'O RachaPix apenas calcula divisões e gera QR Codes Pix; não processa, intermedeia nem garante pagamentos. Confira sempre os dados no seu banco antes de pagar. Você é responsável pelas informações que digita.';

/**
 * Nota de projeto pessoal, exibida na identificação e no rodapé.
 */
export const PROJECT_NOTE =
  'RachaPix é um projeto pessoal, sem fins comerciais.';

/**
 * Texto do checkbox de consentimento.
 */
export const TERMS_CONSENT_TEXT =
  'Li e aceito os Termos de Uso e a Política de Privacidade.';

export interface LegalClause {
  number: number;
  title: string;
  body: string;
}

/**
 * cláusulas dos Termos de Uso verbatim conforme scratchpad/termos.md.
 */
export const LEGAL_TERMS_CLAUSES: LegalClause[] = [
  {
    number: 1,
    title: 'Natureza do serviço',
    body: 'O RachaPix é uma ferramenta gratuita de cálculo e organização de divisões de contas. O site não é instituição financeira, de pagamento ou de crédito. Ele não recebe, guarda, intermedeia nem transfere valores. Também não tem acesso a contas bancárias, senhas ou dados de cartão.',
  },
  {
    number: 2,
    title: 'Pagamentos',
    body: 'O serviço apenas gera QR Codes e códigos Pix "copia e cola" com base nos dados informados pelo próprio usuário. Todo pagamento é feito por iniciativa do usuário, no aplicativo da sua instituição financeira, e é regido pelas regras dessa instituição e do Banco Central do Brasil.',
  },
  {
    number: 3,
    title: 'Responsabilidade do usuário',
    body: 'O usuário é o único responsável pela veracidade e pela conferência dos dados que informa (chave Pix, nome do recebedor, valores e participantes). Antes de confirmar qualquer pagamento, confira os dados exibidos no seu banco. Pagamentos Pix são, em regra, irrevogáveis.',
  },
  {
    number: 4,
    title: 'Sem garantia',
    body: 'O serviço é oferecido "no estado em que se encontra", sem garantia de disponibilidade ininterrupta ou de ausência de erros. Os cálculos são auxiliares e não substituem comprovante, recibo ou acordo entre as partes.',
  },
  {
    number: 5,
    title: 'Limitação de responsabilidade',
    body: 'Na máxima extensão permitida pela lei, o RachaPix não se responsabiliza por perdas, golpes, erros de digitação, chaves incorretas, divergências de valores, disputas entre participantes ou qualquer movimentação financeira feita com base nas informações do site. Isso não exclui a responsabilidade que a legislação não permite afastar.',
  },
  {
    number: 6,
    title: 'Dados pessoais (LGPD)',
    body: `Os dados informados (nomes, chaves Pix, valores) são usados apenas para o funcionamento do serviço, conforme a Lei nº 13.709/2018 (LGPD). Evite inserir informações desnecessárias. Para pedir exclusão de dados, contate: ${EMAIL_CONTATO}.`,
  },
  {
    number: 7,
    title: 'Links e grupos',
    body: 'Quem tem o link de um grupo ou divisão pode ver as informações dele. Compartilhe apenas com pessoas de confiança.',
  },
];
