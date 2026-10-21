import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Select } from '@/components/ui/Select';

const options = Array.from({ length: 200 }, (_, i) => ({ value: `v${i}`, label: `Cidade ${i}` }));

const mockMatchMedia = (matches: boolean) => {
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
};

describe.each([
  ['desktop', false],
  ['mobile', true],
])('Select list scrolling (%s)', (_label, mobile) => {
  const scrollIntoView = vi.fn();

  beforeEach(() => {
    scrollIntoView.mockClear();
    Element.prototype.scrollIntoView = scrollIntoView;
    mockMatchMedia(mobile);
  });

  it('does not snap back to the active option while the user scrolls the list', () => {
    render(<Select value="v100" onChange={() => {}} options={options} ariaLabel="Cidade" />);
    fireEvent.click(screen.getByRole('combobox'));

    const list = screen.getByRole('listbox');
    const callsAfterOpen = scrollIntoView.mock.calls.length;

    for (let i = 0; i < 10; i++) {
      act(() => {
        list.scrollTop = i * 40;
        // Scrolls do not bubble, but window listeners in capture phase still see them.
        list.dispatchEvent(new Event('scroll', { bubbles: false }));
      });
    }

    expect(scrollIntoView.mock.calls.length).toBe(callsAfterOpen);
  });
});
