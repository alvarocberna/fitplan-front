import { describe, it, expect, vi, afterEach } from 'vitest';
import { clearClientState } from './clear-client-state';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('clearClientState', () => {
  it('removes the consultation (health data) and the plan selection, leaving other keys alone', () => {
    localStorage.setItem('consulta_context', '{"anamnesis":{}}');
    localStorage.setItem('plan_selection', '{"cartItem":null}');
    localStorage.setItem('otra_clave', 'x');

    clearClientState();

    expect(localStorage.getItem('consulta_context')).toBeNull();
    expect(localStorage.getItem('plan_selection')).toBeNull();
    expect(localStorage.getItem('otra_clave')).toBe('x');
  });

  it('does not throw when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    expect(() => clearClientState()).not.toThrow();
  });
});
