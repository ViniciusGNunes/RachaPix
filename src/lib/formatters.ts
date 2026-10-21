import { ExpenseCategory, PixKeyType } from './api';

export function formatBRL(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  // dateString may be yyyy-MM-dd or ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }
  try {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('pt-BR').format(d);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return dateString;
  }
}

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  Food: 'Alimentação',
  Groceries: 'Mercado',
  Housing: 'Moradia / Aluguel',
  Utilities: 'Contas & Boletos',
  Transport: 'Transporte',
  Entertainment: 'Lazer & Passeios',
  Health: 'Saúde & Farmácia',
  Travel: 'Viagem',
  Shopping: 'Compras',
  Other: 'Outros',
  Uncategorized: 'Sem Categoria',
};

export const PIX_KEY_TYPE_LABELS: Record<PixKeyType, string> = {
  Cpf: 'CPF',
  Cnpj: 'CNPJ',
  Email: 'E-mail',
  Phone: 'Telefone (+55)',
  Random: 'Chave Aleatória',
};

export function normalizePixKey(key: string, type: PixKeyType): string {
  const trimmed = key.trim();
  switch (type) {
    case 'Cpf':
    case 'Cnpj':
      return trimmed.replace(/\D/g, '');
    case 'Email':
      return trimmed.toLowerCase();
    case 'Phone': {
      const digits = trimmed.replace(/\D/g, '');
      if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
        return `+${digits}`;
      }
      if (digits.length === 10 || digits.length === 11) {
        return `+55${digits}`;
      }
      return trimmed.startsWith('+') ? trimmed : `+${digits}`;
    }
    case 'Random':
    default:
      return trimmed;
  }
}

function checkDigit(digits: string, weights: number[]): number {
  let sum = 0;
  for (let i = 0; i < weights.length; i++) sum += Number(digits[i]) * weights[i];
  const r = sum % 11;
  return r < 2 ? 0 : 11 - r;
}

export function isValidCpf(value: string): boolean {
  const d = value.replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  return (
    checkDigit(d, [10, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(d[9]) &&
    checkDigit(d, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(d[10])
  );
}

export function isValidCnpj(value: string): boolean {
  const d = value.replace(/\D/g, '');
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  return (
    checkDigit(d, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(d[12]) &&
    checkDigit(d, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(d[13])
  );
}

export function maskPixKey(value: string, type: PixKeyType): string {
  const digits = value.replace(/\D/g, '');
  switch (type) {
    case 'Cpf': {
      const d = digits.slice(0, 11);
      return d
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
    }
    case 'Cnpj': {
      const d = digits.slice(0, 14);
      return d
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
        .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5');
    }
    case 'Phone': {
      const national = digits.length > 11 && digits.startsWith('55') ? digits.slice(2) : digits;
      const d = national.slice(0, 11);
      if (d.length === 0) return '';
      if (d.length <= 2) return `(${d}`;
      if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
      if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
      return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    }
    case 'Email':
      return value.replace(/\s/g, '').toLowerCase().slice(0, 77);
    case 'Random':
    default:
      return value.replace(/[^0-9a-fA-F-]/g, '').toLowerCase().slice(0, 36);
  }
}

export const PIX_KEY_PLACEHOLDERS: Record<PixKeyType, string> = {
  Cpf: '000.000.000-00',
  Cnpj: '00.000.000/0000-00',
  Email: 'seu@email.com',
  Phone: '(11) 99999-9999',
  Random: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
};

const STATE_CAPITALS = {
  SP: 'Sao Paulo', RJ: 'Rio de Janeiro', ES: 'Vitoria', MG: 'Belo Horizonte',
  PR: 'Curitiba', SC: 'Florianopolis', RS: 'Porto Alegre', DF: 'Brasilia',
  GO: 'Goiania', TO: 'Palmas', MT: 'Cuiaba', MS: 'Campo Grande',
  AC: 'Rio Branco', RO: 'Porto Velho', BA: 'Salvador', SE: 'Aracaju',
  PE: 'Recife', AL: 'Maceio', PB: 'Joao Pessoa', RN: 'Natal',
  CE: 'Fortaleza', PI: 'Teresina', MA: 'Sao Luis', PA: 'Belem',
  AM: 'Manaus', RR: 'Boa Vista', AP: 'Macapa',
} as const;

const STATE_DDDS: Record<keyof typeof STATE_CAPITALS, string[]> = {
  SP: ['11', '12', '13', '14', '15', '16', '17', '18', '19'],
  RJ: ['21', '22', '24'],
  ES: ['27', '28'],
  MG: ['31', '32', '33', '34', '35', '37', '38'],
  PR: ['41', '42', '43', '44', '45', '46'],
  SC: ['47', '48', '49'],
  RS: ['51', '53', '54', '55'],
  DF: ['61'],
  GO: ['62', '64'],
  TO: ['63'],
  MT: ['65', '66'],
  MS: ['67'],
  AC: ['68'],
  RO: ['69'],
  BA: ['71', '73', '74', '75', '77'],
  SE: ['79'],
  PE: ['81', '87'],
  AL: ['82'],
  PB: ['83'],
  RN: ['84'],
  CE: ['85', '88'],
  PI: ['86', '89'],
  PA: ['91', '93', '94'],
  AM: ['92', '97'],
  RR: ['95'],
  AP: ['96'],
  MA: ['98', '99'],
};

export type UF = keyof typeof STATE_CAPITALS;

export const UF_LIST = (Object.keys(STATE_CAPITALS) as UF[]).sort((a, b) => a.localeCompare(b));

const DDD_UF = new Map<string, UF>(
  (Object.keys(STATE_DDDS) as UF[]).flatMap((uf) =>
    STATE_DDDS[uf].map((ddd) => [ddd, uf] as [string, UF])
  )
);

export function getStateCapital(uf: UF): string {
  return STATE_CAPITALS[uf];
}

export function suggestCityFromPhone(
  phone: string
): { city: string; ddd: string; uf: UF } | null {
  const digits = phone.replace(/\D/g, '');
  const national = digits.length > 11 && digits.startsWith('55') ? digits.slice(2) : digits;
  const ddd = national.slice(0, 2);
  const uf = DDD_UF.get(ddd);
  return uf ? { city: STATE_CAPITALS[uf], ddd, uf } : null;
}

export function sanitizePixName(name: string): string {
  // Max 25 chars, uppercase, no accents
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()
    .slice(0, 25);
}

export function sanitizePixCity(city: string): string {
  // Max 15 chars, uppercase, no accents
  return city
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()
    .slice(0, 15);
}

const OVERDUE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

/** True when `createdAt` is more than 7 days ago. */
export function isOverdueSince(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() > OVERDUE_AFTER_MS;
}
