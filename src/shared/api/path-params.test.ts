import { describe, it, expect } from 'vitest';
import { InvalidPathParamError, uuidParam } from './path-params';
import { runAction } from './action-result';

describe('uuidParam', () => {
  it('returns a valid UUID unchanged', () => {
    expect(uuidParam('8b1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b')).toBe('8b1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b');
  });

  it.each([
    ['../me/plans'],
    ['8b1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b/../../me'],
    ['8b1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b?x=1'],
    ['order-1'],
    [''],
    [undefined],
    [null],
    [123],
    [{ toString: () => '8b1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b' }],
  ])('rejects %p: a Server Action argument is untrusted input', (value) => {
    expect(() => uuidParam(value)).toThrow(InvalidPathParamError);
  });

  it('surfaces through runAction as a 404, so services treat it as "not found" without calling the backend', async () => {
    const result = await runAction(async () => uuidParam('../me/plans'));

    expect(result).toMatchObject({ ok: false, status: 404, code: 'NOT_FOUND' });
  });
});
