import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryProvider } from '@/lib/query/provider';
import { useSplitPublic } from '@/lib/query/splits';

describe('Query Hooks & Provider', () => {
  it('initializes query hook inside QueryProvider without throwing', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryProvider>{children}</QueryProvider>
    );

    const { result } = renderHook(() => useSplitPublic('', { enabled: false }), { wrapper });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
      expect(result.current.data).toBeUndefined();
    });
  });
});
