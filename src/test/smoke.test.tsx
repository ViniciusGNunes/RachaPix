import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { storage, getSavedSplits, saveSplit, getLastCity, saveLastCity } from '@/lib/storage';

describe('Test Environment & Storage Setup', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders React components with testing library and checks DOM', () => {
    render(<Skeleton className="test-skeleton" />);
    const el = document.querySelector('.test-skeleton');
    expect(el).toBeInTheDocument();
  });

  it('runs tests in jsdom environment with localStorage support', () => {
    expect(typeof window).toBe('object');
    expect(typeof localStorage).toBe('object');
    storage.setItem('test_key', 'test_value');
    expect(storage.getItem('test_key')).toBe('test_value');
    storage.removeItem('test_key');
    expect(storage.getItem('test_key')).toBeNull();
  });

  it('safely serializes and reads splits and last city', () => {
    expect(getSavedSplits()).toEqual([]);
    saveSplit({
      slug: 'churrasco-123',
      adminToken: 'admin_xyz',
      title: 'Churrasco de Domingo',
      totalAmount: 150,
      createdAt: new Date().toISOString(),
    });

    const splits = getSavedSplits();
    expect(splits).toHaveLength(1);
    expect(splits[0].slug).toBe('churrasco-123');

    expect(getLastCity()).toBeNull();
    saveLastCity({ city: 'São Paulo', uf: 'SP' });
    expect(getLastCity()).toEqual({ city: 'São Paulo', uf: 'SP' });
  });
});
