import { getGroupCredentials } from './storage';

// RachaConta - Typed API Client (docs/API.md)

export type SplitMode = 'Equal' | 'Custom';
export type PixKeyType = 'Cpf' | 'Cnpj' | 'Email' | 'Phone' | 'Random';

export type PaymentMethod =
  | 'Pix'
  | 'Cash'
  | 'CreditCard'
  | 'DebitCard'
  | 'BankTransfer'
  | 'MealVoucher'
  | 'Other';

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
  | 'Other';

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
  accessToken?: string | null;
  adminToken?: string | null;
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
  paymentMethod: PaymentMethod;
  paidByMemberId: string;
  paidByName: string;
  shareMode: ShareMode;
  shares: ExpenseShareDto[];
  notes: string | null;
  createdAt: string;
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
  paymentMethod: PaymentMethod;
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
  paymentMethod: PaymentMethod;
  notes: string | null;
  createdAt: string;
}

export interface CreateSettlementRequest {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
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

export interface PaymentMethodStatDto {
  paymentMethod: PaymentMethod;
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
  byPaymentMethod: PaymentMethodStatDto[];
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5080';

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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers = new Headers(options.headers || {});

  const groupMatch = /^\/api\/groups\/([0-9a-fA-F-]{36})(?:\/|\?|$)/.exec(path);
  if (groupMatch && !headers.has('X-Group-Token')) {
    const credentials = getGroupCredentials(groupMatch[1]);
    const token = credentials?.adminToken ?? credentials?.accessToken;
    if (token) headers.set('X-Group-Token', token);
  }
  
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let problem: ProblemDetails | undefined;
    let errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`;

    try {
      const data = await response.json();
      problem = data as ProblemDetails;
      if (problem.detail && problem.detail !== 'One or more validation errors occurred.') {
        errorMessage = problem.detail;
      } else if (problem.errors && Object.keys(problem.errors).length > 0) {
        const errorList = Object.values(problem.errors).flat();
        if (errorList.length > 0) errorMessage = errorList.join(', ');
      } else if (problem.detail) {
        errorMessage = problem.detail;
      } else if (problem.title) {
        errorMessage = problem.title;
      }
    } catch {
      // not JSON
    }

    throw new ApiError(response.status, errorMessage, problem);
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
      paymentMethod?: string;
      memberId?: string;
    }
  ): Promise<ExpenseDto[]> {
    const params = new URLSearchParams();
    if (filters?.from) params.set('from', filters.from);
    if (filters?.to) params.set('to', filters.to);
    if (filters?.category) params.set('category', filters.category);
    if (filters?.paymentMethod) params.set('paymentMethod', filters.paymentMethod);
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
