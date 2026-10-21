import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, ApiError } from '@/lib/api';
import { saveGroup, removeSavedGroup } from '@/lib/storage';

describe('api.ts request layer', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('Successful requests', () => {
    it('executes GET request and parses JSON body', async () => {
      const mockSplitData = {
        slug: 'teste-churras',
        title: 'Churrasco da Turma',
        totalAmount: 100,
        receiverName: 'Carlos',
        createdAt: '2026-10-21T00:00:00Z',
        participants: [],
        paidCount: 0,
        paidAmount: 0,
        pendingCount: 0,
      };

      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSplitData,
      } as unknown as Response);

      const result = await api.getSplitPublic('teste-churras');
      expect(result).toEqual(mockSplitData);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:5080/api/splits/teste-churras',
        expect.objectContaining({
          headers: expect.any(Headers),
        })
      );
    });

    it('handles 204 No Content responses by returning undefined', async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 204,
      } as unknown as Response);

      const result = await api.deleteSplit('teste-slug', 'token-abc');
      expect(result).toBeUndefined();
    });
  });

  describe('Error handling & ProblemDetails', () => {
    it('parses ProblemDetails detail on 4xx errors', async () => {
      const problem = {
        title: 'Bad Request',
        status: 400,
        detail: 'O valor da conta é inválido.',
      };

      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => problem,
      } as unknown as Response);

      await expect(api.getSplitPublic('invalido')).rejects.toSatisfy((err: unknown) => {
        expect(err).toBeInstanceOf(ApiError);
        const apiErr = err as ApiError;
        expect(apiErr.status).toBe(400);
        expect(apiErr.message).toBe('O valor da conta é inválido.');
        expect(apiErr.problem).toEqual(problem);
        return true;
      });
    });

    it('formats validation errors list when detail is generic', async () => {
      const problem = {
        title: 'Validation Failed',
        status: 422,
        detail: 'One or more validation errors occurred.',
        errors: {
          title: ['Título deve ter pelo menos 3 caracteres.'],
          amount: ['Valor deve ser positivo.'],
        },
      };

      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        json: async () => problem,
      } as unknown as Response);

      await expect(api.createGroup({ name: '' })).rejects.toSatisfy((err: unknown) => {
        expect(err).toBeInstanceOf(ApiError);
        const apiErr = err as ApiError;
        expect(apiErr.status).toBe(422);
        expect(apiErr.message).toContain('Título deve ter pelo menos 3 caracteres.');
        expect(apiErr.message).toContain('Valor deve ser positivo.');
        return true;
      });
    });

    it('falls back to HTTP status message when response is not JSON', async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        json: async () => {
          throw new Error('Not JSON');
        },
      } as unknown as Response);

      await expect(api.getGroup('12345678-1234-1234-1234-123456789abc')).rejects.toSatisfy(
        (err: unknown) => {
          expect(err).toBeInstanceOf(ApiError);
          const apiErr = err as ApiError;
          expect(apiErr.status).toBe(502);
          expect(apiErr.message).toBe('Erro HTTP 502: Bad Gateway');
          return true;
        }
      );
    });

    it('translates network failures (TypeError) to friendly ApiError with status 0', async () => {
      globalThis.fetch = vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(api.getSplitPublic('teste')).rejects.toSatisfy((err: unknown) => {
        expect(err).toBeInstanceOf(ApiError);
        const apiErr = err as ApiError;
        expect(apiErr.status).toBe(0);
        expect(apiErr.message).toBe('Sem conexão com o servidor. Tente novamente.');
        return true;
      });
    });
  });

  describe('Group token header attachment', () => {
    const groupId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

    it('attaches memberToken when available in storage', async () => {
      saveGroup({
        id: groupId,
        name: 'Grupo Teste',
        memberToken: 'tok-member-secret',
        adminToken: 'tok-admin-secret',
        accessToken: 'tok-invite-secret',
      });

      let capturedHeaders: Headers | undefined;
      globalThis.fetch = vi.fn().mockImplementationOnce((_url, init) => {
        capturedHeaders = init?.headers as Headers;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ id: groupId, name: 'Grupo Teste' }),
        });
      });

      await api.getGroup(groupId);

      expect(capturedHeaders?.get('X-Group-Token')).toBe('tok-member-secret');
    });

    it('falls back to adminToken when memberToken is absent', async () => {
      removeSavedGroup(groupId);
      saveGroup({
        id: groupId,
        name: 'Grupo Teste',
        adminToken: 'tok-admin-only',
        accessToken: 'tok-invite-only',
      });

      let capturedHeaders: Headers | undefined;
      globalThis.fetch = vi.fn().mockImplementationOnce((_url, init) => {
        capturedHeaders = init?.headers as Headers;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ id: groupId }),
        });
      });

      await api.getGroup(groupId);

      expect(capturedHeaders?.get('X-Group-Token')).toBe('tok-admin-only');
    });

    it('falls back to accessToken when memberToken and adminToken are absent', async () => {
      removeSavedGroup(groupId);
      saveGroup({
        id: groupId,
        name: 'Grupo Teste',
        accessToken: 'tok-invite-only',
      });

      let capturedHeaders: Headers | undefined;
      globalThis.fetch = vi.fn().mockImplementationOnce((_url, init) => {
        capturedHeaders = init?.headers as Headers;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ id: groupId }),
        });
      });

      await api.getGroup(groupId);

      expect(capturedHeaders?.get('X-Group-Token')).toBe('tok-invite-only');
    });

    it('does not overwrite explicitly supplied X-Group-Token header', async () => {
      saveGroup({
        id: groupId,
        memberToken: 'stored-member-token',
        accessToken: 'stored-invite-token',
      });

      let capturedHeaders: Headers | undefined;
      globalThis.fetch = vi.fn().mockImplementationOnce((_url, init) => {
        capturedHeaders = init?.headers as Headers;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ memberToken: 'new-token' }),
        });
      });

      // claimMember deliberately specifies invite or admin token in its options
      await api.claimMember(groupId, { memberId: 'm1' });

      // Because claimMember explicitly supplies X-Group-Token, attachGroupToken does not overwrite it
      expect(capturedHeaders?.get('X-Group-Token')).toBe('stored-invite-token');
    });
  });
});
