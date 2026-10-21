import { describe, it, expect } from 'vitest';
import {
  formatBRL,
  formatDate,
  formatDateTime,
  CATEGORY_LABELS,
  PIX_KEY_TYPE_LABELS,
  PIX_KEY_PLACEHOLDERS,
  normalizePixKey,
  maskPixKey,
  isValidCpf,
  isValidCnpj,
  suggestCityFromPhone,
  getStateCapital,
  UF_LIST,
  sanitizePixName,
  sanitizePixCity,
  isOverdueSince,
} from '@/lib/formatters';

describe('formatters.ts', () => {
  describe('formatBRL', () => {
    it('handles null, undefined and NaN safely', () => {
      expect(formatBRL(null)).toBe('R$ 0,00');
      expect(formatBRL(undefined)).toBe('R$ 0,00');
      expect(formatBRL(NaN)).toBe('R$ 0,00');
    });

    it('formats positive and negative amounts in pt-BR currency format', () => {
      // Replace non-breaking space (char 160) with standard space for stable comparison
      const formattedPositive = formatBRL(1234.56).replace(/\u00A0/g, ' ');
      expect(formattedPositive).toBe('R$ 1.234,56');

      const formattedZero = formatBRL(0).replace(/\u00A0/g, ' ');
      expect(formattedZero).toBe('R$ 0,00');

      const formattedNegative = formatBRL(-50.5).replace(/\u00A0/g, ' ');
      expect(formattedNegative).toMatch(/-R\$\s*50,50|R\$\s*-50,50/);
    });
  });

  describe('formatDate and formatDateTime', () => {
    it('returns empty string for null, undefined or empty input', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
      expect(formatDate('')).toBe('');
      expect(formatDateTime(null)).toBe('');
      expect(formatDateTime(undefined)).toBe('');
      expect(formatDateTime('')).toBe('');
    });

    it('formats yyyy-MM-dd directly without timezone shift', () => {
      expect(formatDate('2026-10-21')).toBe('21/10/2026');
    });

    it('formats ISO timestamps', () => {
      const formatted = formatDate('2026-05-15T12:00:00Z');
      expect(formatted).toMatch(/15\/05\/2026/);
    });

    it('falls back gracefully on invalid dates', () => {
      expect(formatDate('not-a-date')).toBe('not-a-date');
      expect(formatDateTime('not-a-date')).toBe('not-a-date');
    });
  });

  describe('labels and placeholders', () => {
    it('provides labels for all categories and pix key types', () => {
      expect(CATEGORY_LABELS.Food).toBe('Alimentação');
      expect(CATEGORY_LABELS.Housing).toBe('Moradia / Aluguel');
      expect(CATEGORY_LABELS.Other).toBe('Outros');

      expect(PIX_KEY_TYPE_LABELS.Cpf).toBe('CPF');
      expect(PIX_KEY_TYPE_LABELS.Cnpj).toBe('CNPJ');
      expect(PIX_KEY_TYPE_LABELS.Email).toBe('E-mail');
      expect(PIX_KEY_TYPE_LABELS.Phone).toBe('Telefone (+55)');
      expect(PIX_KEY_TYPE_LABELS.Random).toBe('Chave Aleatória');

      expect(PIX_KEY_PLACEHOLDERS.Cpf).toBe('000.000.000-00');
      expect(PIX_KEY_PLACEHOLDERS.Email).toBe('seu@email.com');
    });
  });

  describe('normalizePixKey', () => {
    it('normalizes CPF and CNPJ by removing non-digits', () => {
      expect(normalizePixKey('123.456.789-01', 'Cpf')).toBe('12345678901');
      expect(normalizePixKey('12.345.678/0001-95', 'Cnpj')).toBe('12345678000195');
    });

    it('normalizes Email by trimming and lowercasing', () => {
      expect(normalizePixKey('  User@Domain.COM  ', 'Email')).toBe('user@domain.com');
    });

    it('normalizes Phone with international +55 prefix', () => {
      expect(normalizePixKey('11987654321', 'Phone')).toBe('+5511987654321');
      expect(normalizePixKey('+5511987654321', 'Phone')).toBe('+5511987654321');
      expect(normalizePixKey('5511987654321', 'Phone')).toBe('+5511987654321');
      expect(normalizePixKey('(11) 98765-4321', 'Phone')).toBe('+5511987654321');
    });

    it('normalizes Random keys by trimming', () => {
      expect(normalizePixKey('  abc-123  ', 'Random')).toBe('abc-123');
    });
  });

  describe('maskPixKey', () => {
    it('masks CPF', () => {
      expect(maskPixKey('12345678901', 'Cpf')).toBe('123.456.789-01');
      expect(maskPixKey('123', 'Cpf')).toBe('123');
      expect(maskPixKey('123456', 'Cpf')).toBe('123.456');
    });

    it('masks CNPJ', () => {
      expect(maskPixKey('12345678000195', 'Cnpj')).toBe('12.345.678/0001-95');
    });

    it('masks Phone numbers progressively', () => {
      expect(maskPixKey('11', 'Phone')).toBe('(11');
      expect(maskPixKey('119876', 'Phone')).toBe('(11) 9876');
      expect(maskPixKey('1187654321', 'Phone')).toBe('(11) 8765-4321');
      expect(maskPixKey('11987654321', 'Phone')).toBe('(11) 98765-4321');
      expect(maskPixKey('5511987654321', 'Phone')).toBe('(11) 98765-4321');
    });

    it('masks Email and Random keys with length and character restrictions', () => {
      expect(maskPixKey(' Test @ Domain . com ', 'Email')).toBe('test@domain.com');
      expect(
        maskPixKey('12345678-abcd-1234-abcd-1234567890ab', 'Random')
      ).toBe('12345678-abcd-1234-abcd-1234567890ab');
    });
  });

  describe('isValidCpf and isValidCnpj', () => {
    it('validates CPFs correctly', () => {
      // Known valid CPF
      expect(isValidCpf('52998224725')).toBe(true);
      expect(isValidCpf('529.982.247-25')).toBe(true);

      // Repeated digits
      expect(isValidCpf('11111111111')).toBe(false);
      expect(isValidCpf('00000000000')).toBe(false);

      // Wrong length or check digit
      expect(isValidCpf('1234567890')).toBe(false);
      expect(isValidCpf('52998224720')).toBe(false);
    });

    it('validates CNPJs correctly', () => {
      // Known valid CNPJ (Banco do Brasil)
      expect(isValidCnpj('00000000000191')).toBe(true);
      expect(isValidCnpj('00.000.000/0001-91')).toBe(true);

      // Repeated digits
      expect(isValidCnpj('11111111111111')).toBe(false);

      // Wrong length or check digit
      expect(isValidCnpj('00000000000192')).toBe(false);
      expect(isValidCnpj('12345')).toBe(false);
    });
  });

  describe('Location & Phone Helpers', () => {
    it('returns capital for a given UF', () => {
      expect(getStateCapital('SP')).toBe('Sao Paulo');
      expect(getStateCapital('RJ')).toBe('Rio de Janeiro');
      expect(getStateCapital('MG')).toBe('Belo Horizonte');
      expect(UF_LIST).toContain('SP');
      expect(UF_LIST).toContain('DF');
    });

    it('suggests city from phone DDD', () => {
      expect(suggestCityFromPhone('11999998888')).toEqual({
        city: 'Sao Paulo',
        ddd: '11',
        uf: 'SP',
      });
      expect(suggestCityFromPhone('+55 (21) 98888-7777')).toEqual({
        city: 'Rio de Janeiro',
        ddd: '21',
        uf: 'RJ',
      });
      expect(suggestCityFromPhone('00999998888')).toBeNull();
    });
  });

  describe('Sanitization & Overdue Helpers', () => {
    it('sanitizes pix names and cities (uppercase, unaccented, truncated)', () => {
      expect(sanitizePixName('João da Silva São Paulo')).toBe('JOAO DA SILVA SAO PAULO');
      expect(sanitizePixName('Nome Extremamente Longo Que Ultrapassa Vinte E Cinco Caracteres')).toHaveLength(25);

      expect(sanitizePixCity('Ribeirão Preto')).toBe('RIBEIRAO PRETO');
      expect(sanitizePixCity('Cidade Com Nome Muito Longo')).toHaveLength(15);
    });

    it('checks overdue status based on 7 days threshold', () => {
      const now = Date.now();
      const sixDaysAgo = new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString();
      const eightDaysAgo = new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString();

      expect(isOverdueSince(sixDaysAgo)).toBe(false);
      expect(isOverdueSince(eightDaysAgo)).toBe(true);
    });
  });
});
