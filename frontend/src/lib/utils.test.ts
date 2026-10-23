import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, formatDate, generateIdempotencyKey } from './utils';

describe('Utility Functions', () => {
  it('cn merges tailwind classes properly', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-sm', false && 'text-lg', 'font-bold')).toBe('text-sm font-bold');
  });

  it('formatCurrency formats numbers correctly', () => {
    expect(formatCurrency(12.5)).toBe('$12.50');
    expect(formatCurrency('19.99')).toBe('$19.99');
    expect(formatCurrency(null)).toBe('$0.00');
    expect(formatCurrency(undefined)).toBe('$0.00');
  });

  it('generateIdempotencyKey returns unique prefixed strings', () => {
    const key1 = generateIdempotencyKey();
    const key2 = generateIdempotencyKey();
    expect(key1).toMatch(/^idem_\d+_[a-z0-9]+$/);
    expect(key2).toMatch(/^idem_\d+_[a-z0-9]+$/);
    expect(key1).not.toBe(key2);
  });

  it('formatDate formats valid ISO dates without crashing', () => {
    const formatted = formatDate('2026-10-23T12:00:00Z');
    expect(formatted).toBeTruthy();
    expect(typeof formatted).toBe('string');
  });
});
