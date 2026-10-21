import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { describeThisDevice } from '@/lib/device';

describe('device.ts - describeThisDevice', () => {
  const originalUserAgent = navigator.userAgent;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const setUserAgent = (ua: string) => {
    Object.defineProperty(navigator, 'userAgent', {
      value: ua,
      configurable: true,
      writable: true,
    });
  };

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
      writable: true,
    });
  });

  it('identifies Chrome on Windows', () => {
    setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    expect(describeThisDevice()).toBe('Chrome · Windows');
  });

  it('identifies Firefox on Linux', () => {
    setUserAgent('Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0');
    expect(describeThisDevice()).toBe('Firefox · Linux');
  });

  it('identifies Safari on macOS', () => {
    setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
    );
    expect(describeThisDevice()).toBe('Safari · macOS');
  });

  it('identifies Edge on Windows', () => {
    setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
    );
    expect(describeThisDevice()).toBe('Edge · Windows');
  });

  it('identifies Opera on Android', () => {
    setUserAgent(
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 OPR/78.0.0.0'
    );
    expect(describeThisDevice()).toBe('Opera · Android');
  });

  it('identifies Safari on iOS (iPhone)', () => {
    setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    );
    expect(describeThisDevice()).toBe('Safari · iOS');
  });

  it('falls back to generic names when browser or OS is unrecognized', () => {
    setUserAgent('CustomBot/1.0');
    expect(describeThisDevice()).toBe('Navegador');

    setUserAgent('CustomBot/1.0 (Windows NT 10.0)');
    expect(describeThisDevice()).toBe('Navegador · Windows');
  });
});
