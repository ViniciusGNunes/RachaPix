import { describe, it, expect, vi, afterEach } from 'vitest';
import { api, ApiError, translateApiMessage } from '@/lib/api';

const originalFetch = globalThis.fetch;

function mockError(status: number, body: unknown) {
  globalThis.fetch = vi.fn().mockResolvedValueOnce({
    ok: false,
    status,
    statusText: '',
    json: async () => {
      if (body === undefined) throw new Error('empty body');
      return body;
    },
  } as unknown as Response);
}

describe('API error messages', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('translates the invalid link code message', () => {
    expect(translateApiMessage(404, 'Invalid or expired code.')).toMatch(/inválido ou expirado/i);
  });

  it('translates the validation messages users hit on split and group forms', () => {
    expect(translateApiMessage(400, 'Invalid email.')).toBe('E-mail inválido.');
    expect(translateApiMessage(400, 'Invalid phone. Use DDD + number, e.g. +5511987654321.')).toMatch(/^Telefone inválido/);
    expect(translateApiMessage(400, 'Invalid random key (EVP UUID).')).toMatch(/^Chave aleatória inválida/);
    expect(translateApiMessage(400, "A member named 'Vinicius 3' already exists in this group.")).toBe(
      "Já existe um membro chamado 'Vinicius 3' neste grupo."
    );
    expect(translateApiMessage(404, "Group 'abc' not found.")).toBe('Grupo não encontrado.');
  });

  it('translates permission, validation and templated messages the API can send', () => {
    const english = /\b(must|only|the|your|member|name|amount|required|not found|pick)\b/i;
    const samples = [
      'Pick who you are in this group first.',
      'Only the person who added this expense, or the admin, can edit it.',
      'Only the person who received the money can confirm it.',
      'Only the person who registered this payment, or the admin, can remove it.',
      'This member was already claimed by someone.',
      'You can only edit your own data.',
      'Group not found.',
      'Name must have 1 to 80 characters.',
      'Title must have 1 to 80 characters.',
      'Description must have 1 to 120 characters.',
      'A split needs 2 to 50 participants.',
      "Duplicate participant name 'Ana'.",
      "Duplicate member name 'Ana'.",
      'Percentages sum to 90 but must sum to 100.',
      'Share amounts sum to 10.00 but the expense amount is 12.34.',
      "Member 'Ana' has no Pix key.",
    ];
    for (const message of samples) {
      const translated = translateApiMessage(400, message);
      expect(translated, message).not.toBe(message);
      expect(translated, message).not.toMatch(english);
    }
    expect(translateApiMessage(400, 'Share amounts sum to 10.00 but the expense amount is 12.34.')).toBe(
      'As partes somam 10,00, mas o valor da despesa é 12,34.'
    );
  });

  it('translates every field error when a response carries several', async () => {
    mockError(400, {
      status: 400,
      title: 'One or more validation errors occurred.',
      detail: 'Title must have 1 to 80 characters. Amount is required.',
      errors: { title: ['Title must have 1 to 80 characters.'], amount: ['Amount is required.'] },
    });
    await expect(api.createSplit({} as never)).rejects.toThrow('O título deve ter de 1 a 80 caracteres. Informe o valor.');
  });

  it('translates each validation error before joining them', async () => {
    mockError(400, {
      status: 400,
      title: 'One or more validation errors occurred.',
      detail: 'One or more validation errors occurred.',
      errors: { pixKey: ['Invalid email.'] },
    });
    await expect(api.createSplit({} as never)).rejects.toThrow('E-mail inválido.');
  });

  it('keeps unknown messages untouched', () => {
    expect(translateApiMessage(400, 'Algo específico')).toBe('Algo específico');
  });

  it('shows a friendly message on 429 even with an empty body', async () => {
    mockError(429, undefined);
    await expect(api.getSplitPublic('abc')).rejects.toSatisfy((err: unknown) => {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).message).toMatch(/Muitas tentativas/);
      expect((err as ApiError).status).toBe(429);
      return true;
    });
  });

  it('shows a friendly message on 429 with a ProblemDetails body', async () => {
    mockError(429, { status: 429, title: 'Too Many Requests', detail: 'Too many attempts. Try again in a minute.' });
    await expect(api.getSplitPublic('abc')).rejects.toThrow(/Muitas tentativas/);
  });

  it('translates the redeem error end to end', async () => {
    mockError(404, { status: 404, title: 'Not Found', detail: 'Invalid or expired code.' });
    await expect(api.getSplitPublic('abc')).rejects.toThrow(/Código inválido ou expirado/);
  });
});
