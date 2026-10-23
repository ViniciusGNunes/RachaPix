import { forgetMemberIdentity, getGroupCredentials } from './storage';
import { toast } from '@/components/ui/Toast';

// RachaPix - Typed API Client (docs/API.md)

export type SplitMode = 'Equal' | 'Custom';
export type PixKeyType = 'Cpf' | 'Cnpj' | 'Email' | 'Phone' | 'Random';

export type ExpenseCategory =
  | 'Food'
  | 'Groceries'
  | 'Housing'
  | 'Utilities'
  | 'Transport'
  | 'Entertainment'
  | 'Health'
  | 'Travel'
  | 'Shopping'
  | 'Other'
  | 'Uncategorized';

export type ShareMode = 'Equal' | 'Custom' | 'Percentage';

export interface ProblemDetails {
  title?: string;
  status?: number;
  detail?: string;
  errors?: Record<string, string[]>;
}

// ================= Module 1 DTOs =================

export interface SplitParticipantRequest {
  name: string;
  isOwner?: boolean;
  amount?: number | null;
}

export interface CreateSplitRequest {
  title: string;
  totalAmount: number;
  pixKey: string;
  pixKeyType: PixKeyType;
  receiverName: string;
  receiverCity: string;
  splitMode: SplitMode;
  participants: SplitParticipantRequest[];
}

export interface SplitParticipantPublicDto {
  id: string;
  name: string;
  amount: number;
  isOwner: boolean;
  paid: boolean;
  paymentPending: boolean;
}

export interface SplitPublicDto {
  slug: string;
  title: string;
  totalAmount: number;
  receiverName: string;
  createdAt: string;
  participants: SplitParticipantPublicDto[];
  paidCount: number;
  paidAmount: number;
  pendingCount: number;
}

export interface SplitParticipantPixDto {
  participantId: string;
  name: string;
  amount: number;
  pixKey: string;
  receiverName: string;
  pixCode: string;
}

export interface SplitParticipantAdminDto {
  id: string;
  name: string;
  amount: number;
  isOwner: boolean;
  paid: boolean;
  paidAt: string | null;
  paymentPending: boolean;
  claimedAt: string | null;
}

export interface SplitAdminDto {
  slug: string;
  title: string;
  totalAmount: number;
  receiverName: string;
  receiverCity: string;
  createdAt: string;
  pixKey: string;
  pixKeyType: PixKeyType;
  adminToken: string | null;
  participants: SplitParticipantAdminDto[];
  paidCount: number;
  paidAmount: number;
  pendingCount: number;
}

// ================= Module 2 DTOs =================

export interface MemberDto {
  id: string;
  name: string;
  pixKey: string | null;
  pixKeyType: PixKeyType | null;
  /** True once someone picked this member as themselves. */
  claimed: boolean;
  isAdmin: boolean;
}

export interface MemberRequest {
  name: string;
  pixKey?: string | null;
  pixKeyType?: PixKeyType | null;
}

export interface MyGroupDto {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  memberCount: number;
  totalSpent: number;
  createdAt: string;
  isAdmin: boolean;
}

export interface GroupLookupItem {
  id: string;
  token: string;
}

export interface GroupDto {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  createdAt: string;
  members: MemberDto[];
  /** Invite token; hidden from people who only hold the invite link. */
  accessToken?: string | null;
  /** Only returned to the holder of the admin token. */
  adminToken?: string | null;
  /** The member the caller picked as themselves, if any. */
  yourMemberId?: string | null;
  isAdmin: boolean;
}

export interface ClaimRequest {
  memberId?: string | null;
  newName?: string | null;
  /** Free-text device name shown in the device list. */
  label?: string | null;
}

export interface LinkCodeDto {
  /** Single-use code, valid for a few minutes. */
  code: string;
  expiresAt: string;
}

export interface DeviceDto {
  id: string;
  label: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  isCurrent: boolean;
}

export interface ClaimResultDto {
  /** Personal token, shown once. Store it and send it as X-Group-Token. */
  memberToken: string;
  member: MemberDto;
}

export type ConfirmationStatus = 'Confirmed' | 'Contested';

export interface ExpenseConfirmationDto {
  memberId: string;
  memberName: string;
  status: ConfirmationStatus;
  comment: string | null;
  createdAt: string;
}

export interface CreateGroupRequest {
  name: string;
  description?: string | null;
  members?: MemberRequest[];
}

export interface UpdateGroupRequest {
  name: string;
  description?: string | null;
}

export interface ExpenseShareDto {
  memberId: string;
  memberName: string;
  amount: number;
  percentage: number | null;
}

export interface ExpenseDto {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  date: string; // yyyy-MM-dd
  category: ExpenseCategory;
  paidByMemberId: string;
  paidByName: string;
  shareMode: ShareMode;
  shares: ExpenseShareDto[];
  notes: string | null;
  createdAt: string;
  createdByMemberId: string | null;
  createdByName: string | null;
  updatedByName: string | null;
  updatedAt: string | null;
  /** Who agreed or disagreed. Required confirmers = shares minus the payer. */
  confirmations: ExpenseConfirmationDto[];
}

export interface ExpenseShareRequest {
  memberId: string;
  amount?: number | null;
  percentage?: number | null;
}

export interface CreateExpenseRequest {
  description: string;
  amount: number;
  date: string; // yyyy-MM-dd
  category: ExpenseCategory;
  paidByMemberId: string;
  shareMode: ShareMode;
  shares: ExpenseShareRequest[];
  notes?: string | null;
}

export type UpdateExpenseRequest = CreateExpenseRequest;

export interface SettlementDto {
  id: string;
  groupId: string;
  fromMemberId: string;
  fromName: string;
  toMemberId: string;
  toName: string;
  amount: number;
  date: string;
  notes: string | null;
  createdAt: string;
  createdByMemberId: string | null;
  createdByName: string | null;
  /** Pending payments do not count in balances until the receiver confirms. */
  status: SettlementStatus;
  confirmedAt: string | null;
}

export type SettlementStatus = 'Pending' | 'Confirmed';

export interface CreateSettlementRequest {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  date: string;
  notes?: string | null;
}

export interface MemberBalanceDto {
  memberId: string;
  name: string;
  paid: number;
  owed: number;
  settlementsSent: number;
  settlementsReceived: number;
  net: number;
}

export interface SuggestedTransferDto {
  fromMemberId: string;
  fromName: string;
  toMemberId: string;
  toName: string;
  amount: number;
}

export interface BalanceDto {
  groupId: string;
  members: MemberBalanceDto[];
  suggestedTransfers: SuggestedTransferDto[];
}

export interface CategoryStatDto {
  category: ExpenseCategory;
  total: number;
}

export interface MemberStatDto {
  memberId: string;
  name: string;
  paid: number;
  owed: number;
}

export interface MonthStatDto {
  month: string;
  total: number;
}

export interface StatsDto {
  groupId: string;
  totalSpent: number;
  byCategory: CategoryStatDto[];
  byMember: MemberStatDto[];
  byMonth: MonthStatDto[];
}

export interface MemberPixDto {
  pixCode: string;
  amount: number;
  name: string;
  pixKey: string;
}

// ================= API Client =================

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5080';
const API_BASE_URL = RAW_API_URL.endsWith('/') ? RAW_API_URL.slice(0, -1) : RAW_API_URL;

export class ApiError extends Error {
  status: number;
  problem?: ProblemDetails;

  constructor(status: number, message: string, problem?: ProblemDetails) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }
}

function attachGroupToken(headers: Headers, path: string): void {
  const groupMatch = /^\/api\/groups\/([0-9a-fA-F-]{36})(?:\/|\?|$)/.exec(path);
  if (!groupMatch || headers.has('X-Group-Token')) return;

  const credentials = getGroupCredentials(groupMatch[1]);
  // Personal token wins: it carries the member's identity. Admin/invite tokens are fallbacks.
  const token = credentials?.memberToken ?? credentials?.adminToken ?? credentials?.accessToken;
  if (token) headers.set('X-Group-Token', token);
}

function buildRequestHeaders(path: string, options: RequestInit): Headers {
  const headers = new Headers(options.headers || {});
  attachGroupToken(headers, path);

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  return headers;
}

function describeProblem(problem: ProblemDetails, fallback: string): string {
  if (problem.errors && Object.keys(problem.errors).length > 0) {
    // Translate each message on its own: the joined detail would never match a known message.
    const errorList = Object.values(problem.errors).flat().map((msg) => translateApiMessage(0, msg));
    if (errorList.length > 0) return errorList.join(' ');
  }
  if (problem.detail) return problem.detail;
  if (problem.title) return problem.title;
  return fallback;
}

// The API answers in English; show Portuguese for the messages users can actually hit.
const KNOWN_MESSAGES: Record<string, string> = {
  'Invalid or expired code.': 'Código inválido ou expirado. Gere um novo código no outro aparelho.',
  'You cannot disconnect your only device.': 'Você não pode desconectar o único aparelho conectado.',
  'Invalid admin token.': 'Token de administrador inválido.',
  'Invalid CPF.': 'CPF inválido.',
  'Invalid CNPJ.': 'CNPJ inválido.',
  'Invalid email.': 'E-mail inválido.',
  'Invalid phone. Use DDD + number, e.g. +5511987654321.': 'Telefone inválido. Use DDD + número, ex.: +5511987654321.',
  'Invalid random key (EVP UUID).': 'Chave aleatória inválida. Use o formato UUID.',
  'A member cannot pay themselves.': 'Um membro não pode pagar a si mesmo.',
  'This member is referenced by expenses or settlements and cannot be removed.':
    'Este membro tem despesas ou pagamentos registrados e não pode ser removido.',
  'Amount must be greater than 0 and at most 1,000,000.': 'O valor deve ser maior que 0 e no máximo 1.000.000.',
  'Amount must be greater than 0.': 'O valor deve ser maior que 0.',
  'Percentage must be greater than 0 and at most 100.': 'A porcentagem deve ser maior que 0 e no máximo 100.',
  "'from' must be on or before 'to'.": 'A data inicial deve ser anterior ou igual à data final.',
  'Total amount must be greater than 0 and at most 1,000,000.': 'O valor total deve ser maior que 0 e no máximo 1.000.000.',
  'Member does not belong to this group.': 'Membro não pertence a este grupo.',
  'Comment must have at most 200 characters.': 'O comentário deve ter no máximo 200 caracteres.',
  'Pick who you are in this group before making changes.': 'Escolha quem você é neste grupo antes de fazer alterações.',
  'Only the group admin can do this.': 'Apenas o administrador do grupo pode fazer isso.',
  'You can only register payments you made or received.': 'Você só pode registrar pagamentos que fez ou recebeu.',
  'Only the person who added this expense, or the admin, can delete it.':
    'Apenas quem adicionou esta despesa ou o administrador pode excluí-la.',
  'Only the people this expense was split with can confirm or contest it.':
    'Apenas as pessoas que dividem esta despesa podem confirmar ou contestar.',
  'You already picked an identity in this group.': 'Você já escolheu sua identidade neste grupo.',
  'Pick who you are in this group first.': 'Escolha quem você é neste grupo primeiro.',
  'Only the person who added this expense, or the admin, can edit it.':
    'Apenas quem adicionou esta despesa ou o administrador pode editá-la.',
  'Only the person who received the money can confirm it.': 'Apenas quem recebeu o dinheiro pode confirmar o pagamento.',
  'Only the person who registered this payment, or the admin, can remove it.':
    'Apenas quem registrou este pagamento ou o administrador pode removê-lo.',
  'This member was already claimed by someone.': 'Este membro já foi escolhido por outra pessoa.',
  'You can only edit your own data.': 'Você só pode editar os seus próprios dados.',
  'Group not found.': 'Grupo não encontrado.',
  'The owner receives the payment and has no Pix code.': 'O organizador recebe o pagamento e não tem código Pix.',
  'The owner is always marked as paid.': 'O organizador já conta como pago.',
  'Member is listed more than once.': 'O membro aparece mais de uma vez.',
  'Member is required.': 'Informe o membro.',
  'Amount is required.': 'Informe o valor.',
  'Amount must have at most 2 decimal places.': 'O valor deve ter no máximo 2 casas decimais.',
  'Amount is required in Custom mode.': 'Informe o valor no modo personalizado.',
  'Percentage is required in Percentage mode.': 'Informe a porcentagem no modo porcentagem.',
  'Percentage must have at most 4 decimal places.': 'A porcentagem deve ter no máximo 4 casas decimais.',
  'Date is required (yyyy-MM-dd).': 'Informe a data.',
  'Description must have 1 to 120 characters.': 'A descrição deve ter de 1 a 120 caracteres.',
  'Description must have at most 500 characters.': 'A descrição deve ter no máximo 500 caracteres.',
  'Notes must have at most 500 characters.': 'As observações devem ter no máximo 500 caracteres.',
  'Name must have 1 to 80 characters.': 'O nome deve ter de 1 a 80 caracteres.',
  'Name must have 1 to 60 characters.': 'O nome deve ter de 1 a 60 caracteres.',
  'Title must have 1 to 80 characters.': 'O título deve ter de 1 a 80 caracteres.',
  'Total amount is required.': 'Informe o valor total.',
  'Total amount must have at most 2 decimal places.': 'O valor total deve ter no máximo 2 casas decimais.',
  'Receiver name must have 1 to 25 characters (letters/digits, accents removed).':
    'O nome do recebedor deve ter de 1 a 25 caracteres (letras e números).',
  'Receiver city must have 1 to 15 characters (letters/digits, accents removed).':
    'A cidade do recebedor deve ter de 1 a 15 caracteres (letras e números).',
  'A split needs 2 to 50 participants.': 'O racha precisa de 2 a 50 participantes.',
  'Only one participant can be the owner.': 'Só um participante pode ser o organizador.',
  'includeOwner is false but a participant is marked as owner.':
    'Há um participante marcado como organizador, mas o organizador não está incluído.',
  'Pix key type is required.': 'Informe o tipo da chave Pix.',
  'Pix key type is required when a Pix key is given.': 'Informe o tipo da chave Pix.',
  'Split mode is required.': 'Informe o modo de divisão.',
  'Share mode is required.': 'Informe o modo de divisão.',
  'Status is required (Confirmed or Contested).': 'Informe o status (confirmado ou contestado).',
  'At least one member must share the expense.': 'Escolha pelo menos um membro para dividir a despesa.',
  'Paying member is required.': 'Informe quem pagou.',
  'Paying member does not belong to this group.': 'Quem pagou não pertence a este grupo.',
  'Receiving member is required.': 'Informe quem recebeu.',
};

const KNOWN_MESSAGE_PATTERNS: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [/^A member named '(.+)' already exists in this group\.$/, (m) => `Já existe um membro chamado '${m[1]}' neste grupo.`],
  [/^Duplicate participant name '(.+)'\.$/, (m) => `Nome de participante repetido: '${m[1]}'.`],
  [/^Duplicate member name '(.+)'\.$/, (m) => `Nome de membro repetido: '${m[1]}'.`],
  [/^Percentages sum to (.+) but must sum to 100\.$/, (m) => `As porcentagens somam ${m[1]}, mas devem somar 100.`],
  [
    /^Share amounts sum to (.+) but the expense amount is (.+)\.$/,
    (m) => `As partes somam ${m[1].replace('.', ',')}, mas o valor da despesa é ${m[2].replace('.', ',')}.`,
  ],
  [/^Member '.+' has no Pix key\.$/, () => 'Este membro não tem chave Pix cadastrada.'],
  [
    /^Query parameter 'amount' must be greater than 0 with at most 2 decimal places\.$/,
    () => 'O valor deve ser maior que 0 e ter no máximo 2 casas decimais.',
  ],
  [/^Group '.+' not found\.$/, () => 'Grupo não encontrado.'],
  [/^Member '.+' not found in this group\.$/, () => 'Membro não encontrado neste grupo.'],
  [/^Expense '.+' not found in this group\.$/, () => 'Despesa não encontrada neste grupo.'],
  [/^Settlement '.+' not found in this group\.$/, () => 'Pagamento não encontrado neste grupo.'],
  [/^Participant '.+' not found in this split\.$/, () => 'Participante não encontrado neste racha.'],
  [/^Split '.+' not found\.$/, () => 'Racha não encontrado.'],
  [/^Device '.+' not found\.$/, () => 'Aparelho não encontrado.'],
];

const TOO_MANY_REQUESTS_MESSAGE = 'Muitas tentativas seguidas. Aguarde um minuto e tente de novo.';

export function translateApiMessage(status: number, message: string): string {
  if (status === 429) return TOO_MANY_REQUESTS_MESSAGE;
  if (KNOWN_MESSAGES[message]) return KNOWN_MESSAGES[message];
  for (const [pattern, toPortuguese] of KNOWN_MESSAGE_PATTERNS) {
    const match = pattern.exec(message);
    if (match) return toPortuguese(match);
  }
  return message;
}

async function buildApiError(response: Response): Promise<ApiError> {
  let problem: ProblemDetails | undefined;
  const fallback = `Erro HTTP ${response.status}: ${response.statusText}`;
  let errorMessage = fallback;

  try {
    const data = await response.json();
    problem = data as ProblemDetails;
    errorMessage = describeProblem(problem, fallback);
  } catch {
    // not JSON
  }

  return new ApiError(response.status, translateApiMessage(response.status, errorMessage), problem);
}

export const IDENTITY_LOST_EVENT = 'rachapix:identity-lost';
const IDENTITY_LOST_MESSAGE = 'Seu acesso a este grupo mudou. Escolha quem você é novamente.';

/**
 * A 404 on a group call made with a personal token means the member was removed or freed by the admin.
 * Forget the stale token right away and tell the open page to reload, instead of showing "group not found".
 */
function dropLostIdentity(path: string, headers: Headers, error: ApiError): ApiError {
  if (error.status !== 404) return error;
  const groupId = /^\/api\/groups\/([0-9a-fA-F-]{36})(?:\/|\?|$)/.exec(path)?.[1];
  const memberToken = groupId ? getGroupCredentials(groupId)?.memberToken : undefined;
  if (!groupId || !memberToken || headers.get('X-Group-Token') !== memberToken) return error;

  forgetMemberIdentity(groupId);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(IDENTITY_LOST_EVENT, { detail: groupId }));
  }
  return new ApiError(error.status, IDENTITY_LOST_MESSAGE, error.problem);
}

let wakeNoticeShown = false;
const WAKE_DELAY_MS = 4000;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers = buildRequestHeaders(path, options);

  const timer = setTimeout(() => {
    if (!wakeNoticeShown) {
      wakeNoticeShown = true;
      toast.info('Acordando o servidor, pode levar até 1 minuto…');
    }
  }, WAKE_DELAY_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err) {
    if (err instanceof TypeError) {
      throw new ApiError(0, 'Sem conexão com o servidor. Tente novamente.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
    wakeNoticeShown = false;
  }

  if (!response.ok) {
    const error = await buildApiError(response);
    throw dropLostIdentity(path, headers, error);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Splits
  createSplit(data: CreateSplitRequest): Promise<SplitAdminDto> {
    return request<SplitAdminDto>('/api/splits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getSplitPublic(slug: string): Promise<SplitPublicDto> {
    return request<SplitPublicDto>(`/api/splits/${encodeURIComponent(slug)}`);
  },

  getParticipantPix(slug: string, participantId: string): Promise<SplitParticipantPixDto> {
    return request<SplitParticipantPixDto>(
      `/api/splits/${encodeURIComponent(slug)}/participants/${encodeURIComponent(participantId)}/pix`
    );
  },

  markPaid(slug: string, participantId: string): Promise<SplitPublicDto> {
    return request<SplitPublicDto>(
      `/api/splits/${encodeURIComponent(slug)}/participants/${encodeURIComponent(participantId)}/mark-paid`,
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    );
  },

  getSplitAdmin(slug: string, token: string): Promise<SplitAdminDto> {
    return request<SplitAdminDto>(
      `/api/splits/${encodeURIComponent(slug)}/admin?token=${encodeURIComponent(token)}`
    );
  },

  rejectClaimAdmin(slug: string, participantId: string, token: string): Promise<SplitAdminDto> {
    return request<SplitAdminDto>(
      `/api/splits/${encodeURIComponent(slug)}/admin/participants/${encodeURIComponent(participantId)}/reject-claim?token=${encodeURIComponent(token)}`,
      {
        method: 'POST',
      }
    );
  },

  togglePaidAdmin(slug: string, participantId: string, token: string): Promise<SplitAdminDto> {
    return request<SplitAdminDto>(
      `/api/splits/${encodeURIComponent(slug)}/admin/participants/${encodeURIComponent(participantId)}/toggle-paid?token=${encodeURIComponent(token)}`,
      {
        method: 'POST',
      }
    );
  },

  deleteSplit(slug: string, token: string): Promise<void> {
    return request<void>(
      `/api/splits/${encodeURIComponent(slug)}?token=${encodeURIComponent(token)}`,
      {
        method: 'DELETE',
      }
    );
  },

  // Groups
  lookupGroups(items: GroupLookupItem[]): Promise<MyGroupDto[]> {
    return request<MyGroupDto[]>('/api/groups/lookup', {
      method: 'POST',
      body: JSON.stringify(items),
    });
  },

  createGroup(data: CreateGroupRequest): Promise<GroupDto> {
    return request<GroupDto>('/api/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getGroup(id: string): Promise<GroupDto> {
    return request<GroupDto>(`/api/groups/${encodeURIComponent(id)}`);
  },

  updateGroup(id: string, data: UpdateGroupRequest): Promise<GroupDto> {
    return request<GroupDto>(`/api/groups/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteGroup(id: string): Promise<void> {
    return request<void>(`/api/groups/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  /** Picks who you are. Uses the admin or invite token on purpose, never the member token. */
  claimMember(groupId: string, data: ClaimRequest): Promise<ClaimResultDto> {
    const credentials = getGroupCredentials(groupId);
    const token = credentials?.adminToken ?? credentials?.accessToken ?? '';
    return request<ClaimResultDto>(`/api/groups/${encodeURIComponent(groupId)}/claim`, {
      method: 'POST',
      headers: { 'X-Group-Token': token },
      body: JSON.stringify(data),
    });
  },

  /** Generates a single-use code so another device can take over your member. */
  createLinkCode(groupId: string): Promise<LinkCodeDto> {
    return request<LinkCodeDto>(`/api/groups/${encodeURIComponent(groupId)}/members/me/link-codes`, {
      method: 'POST',
    });
  },

  /** Trades a link code for this device's own personal token. Uses the invite token on purpose. */
  redeemLinkCode(groupId: string, code: string, label?: string): Promise<ClaimResultDto> {
    const credentials = getGroupCredentials(groupId);
    const token = credentials?.adminToken ?? credentials?.accessToken ?? '';
    return request<ClaimResultDto>(`/api/groups/${encodeURIComponent(groupId)}/link-codes/redeem`, {
      method: 'POST',
      headers: { 'X-Group-Token': token },
      body: JSON.stringify({ code, label }),
    });
  },

  listDevices(groupId: string): Promise<DeviceDto[]> {
    return request<DeviceDto[]>(`/api/groups/${encodeURIComponent(groupId)}/members/me/devices`);
  },

  revokeDevice(groupId: string, deviceId: string): Promise<void> {
    return request<void>(
      `/api/groups/${encodeURIComponent(groupId)}/members/me/devices/${encodeURIComponent(deviceId)}`,
      { method: 'DELETE' }
    );
  },

  /** Admin: replaces the invite token. The old invite link stops working. */
  rotateInvite(groupId: string): Promise<{ accessToken: string }> {
    return request<{ accessToken: string }>(`/api/groups/${encodeURIComponent(groupId)}/rotate-invite`, {
      method: 'POST',
    });
  },

  /** Admin: frees a member so a new person can claim it (lost device). */
  resetMemberClaim(groupId: string, memberId: string): Promise<void> {
    return request<void>(
      `/api/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(memberId)}/reset-claim`,
      { method: 'POST' }
    );
  },

  // Members
  addMember(groupId: string, data: MemberRequest): Promise<MemberDto> {
    return request<MemberDto>(`/api/groups/${encodeURIComponent(groupId)}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateMember(groupId: string, memberId: string, data: MemberRequest): Promise<MemberDto> {
    return request<MemberDto>(
      `/api/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(memberId)}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  },

  deleteMember(groupId: string, memberId: string): Promise<void> {
    return request<void>(
      `/api/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(memberId)}`,
      {
        method: 'DELETE',
      }
    );
  },

  getMemberPix(groupId: string, memberId: string, amount: number): Promise<MemberPixDto> {
    return request<MemberPixDto>(
      `/api/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(memberId)}/pix?amount=${encodeURIComponent(amount.toFixed(2))}`
    );
  },

  // Expenses
  getExpenses(
    groupId: string,
    filters?: {
      from?: string;
      to?: string;
      category?: string;
      memberId?: string;
    }
  ): Promise<ExpenseDto[]> {
    const params = new URLSearchParams();
    if (filters?.from) params.set('from', filters.from);
    if (filters?.to) params.set('to', filters.to);
    if (filters?.category) params.set('category', filters.category);
    if (filters?.memberId) params.set('memberId', filters.memberId);

    const query = params.toString() ? `?${params.toString()}` : '';
    return request<ExpenseDto[]>(`/api/groups/${encodeURIComponent(groupId)}/expenses${query}`);
  },

  getExpense(groupId: string, expenseId: string): Promise<ExpenseDto> {
    return request<ExpenseDto>(
      `/api/groups/${encodeURIComponent(groupId)}/expenses/${encodeURIComponent(expenseId)}`
    );
  },

  createExpense(groupId: string, data: CreateExpenseRequest): Promise<ExpenseDto> {
    return request<ExpenseDto>(`/api/groups/${encodeURIComponent(groupId)}/expenses`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateExpense(groupId: string, expenseId: string, data: UpdateExpenseRequest): Promise<ExpenseDto> {
    return request<ExpenseDto>(
      `/api/groups/${encodeURIComponent(groupId)}/expenses/${encodeURIComponent(expenseId)}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  },

  /** A person the expense was split with confirms or contests it. */
  confirmExpense(
    groupId: string,
    expenseId: string,
    data: { status: ConfirmationStatus; comment?: string | null }
  ): Promise<ExpenseDto> {
    return request<ExpenseDto>(
      `/api/groups/${encodeURIComponent(groupId)}/expenses/${encodeURIComponent(expenseId)}/confirmation`,
      { method: 'POST', body: JSON.stringify(data) }
    );
  },

  deleteExpense(groupId: string, expenseId: string): Promise<void> {
    return request<void>(
      `/api/groups/${encodeURIComponent(groupId)}/expenses/${encodeURIComponent(expenseId)}`,
      {
        method: 'DELETE',
      }
    );
  },

  // Settlements
  getSettlements(groupId: string): Promise<SettlementDto[]> {
    return request<SettlementDto[]>(`/api/groups/${encodeURIComponent(groupId)}/settlements`);
  },

  createSettlement(groupId: string, data: CreateSettlementRequest): Promise<SettlementDto> {
    return request<SettlementDto>(`/api/groups/${encodeURIComponent(groupId)}/settlements`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /** The receiver confirms the money arrived; only then it counts in balances. */
  confirmSettlement(groupId: string, settlementId: string): Promise<SettlementDto> {
    return request<SettlementDto>(
      `/api/groups/${encodeURIComponent(groupId)}/settlements/${encodeURIComponent(settlementId)}/confirm`,
      { method: 'POST' }
    );
  },

  deleteSettlement(groupId: string, settlementId: string): Promise<void> {
    return request<void>(
      `/api/groups/${encodeURIComponent(groupId)}/settlements/${encodeURIComponent(settlementId)}`,
      {
        method: 'DELETE',
      }
    );
  },

  // Balances
  getBalances(groupId: string): Promise<BalanceDto> {
    return request<BalanceDto>(`/api/groups/${encodeURIComponent(groupId)}/balances`);
  },

  // Stats
  getStats(groupId: string, filters?: { from?: string; to?: string }): Promise<StatsDto> {
    const params = new URLSearchParams();
    if (filters?.from) params.set('from', filters.from);
    if (filters?.to) params.set('to', filters.to);

    const query = params.toString() ? `?${params.toString()}` : '';
    return request<StatsDto>(`/api/groups/${encodeURIComponent(groupId)}/stats${query}`);
  },
};
