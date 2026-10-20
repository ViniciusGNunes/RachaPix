import { getGroupCredentials } from './storage';
import { toast } from '@/components/ui/Toast';

// RachaConta - Typed API Client (docs/API.md)

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
  if (problem.detail && problem.detail !== 'One or more validation errors occurred.') {
    return problem.detail;
  }
  if (problem.errors && Object.keys(problem.errors).length > 0) {
    const errorList = Object.values(problem.errors).flat();
    return errorList.length > 0 ? errorList.join(', ') : fallback;
  }
  if (problem.detail) return problem.detail;
  if (problem.title) return problem.title;
  return fallback;
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

  return new ApiError(response.status, errorMessage, problem);
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
    throw await buildApiError(response);
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
