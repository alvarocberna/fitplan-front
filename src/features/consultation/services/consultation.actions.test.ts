import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getOrderStatusAction,
  simulatePaymentAction,
  simulatePaymentRejectionAction,
} from './consultation.actions';
import { apiFetch } from '@/shared/api/client';
import { getValidAccessToken } from '@/shared/auth/tokens';

vi.mock('@/shared/api/client', () => ({ apiFetch: vi.fn() }));
vi.mock('@/shared/auth/tokens', () => ({ getValidAccessToken: vi.fn() }));

const mockedApiFetch = vi.mocked(apiFetch);
const ORDER_ID = '8b1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b';

beforeEach(() => {
  mockedApiFetch.mockReset().mockResolvedValue({ status: 'processed' } as never);
  vi.mocked(getValidAccessToken).mockReset().mockResolvedValue('token-1');
});

describe('consultation actions — seguridad', () => {
  it('simulatePaymentAction sends the user access token (the backend checks the order is theirs)', async () => {
    await simulatePaymentAction(ORDER_ID);

    expect(mockedApiFetch).toHaveBeenCalledWith(`dev/orders/${ORDER_ID}/simulate-payment`, 'POST', undefined, 'token-1');
  });

  it('simulatePaymentRejectionAction sends the user access token', async () => {
    await simulatePaymentRejectionAction(ORDER_ID);

    expect(mockedApiFetch).toHaveBeenCalledWith(
      `dev/orders/${ORDER_ID}/simulate-payment-rejection`,
      'POST',
      undefined,
      'token-1',
    );
  });

  it.each([
    ['getOrderStatusAction', getOrderStatusAction],
    ['simulatePaymentAction', simulatePaymentAction],
    ['simulatePaymentRejectionAction', simulatePaymentRejectionAction],
  ])('%s never calls the backend with an id that is not a UUID (path injection)', async (_name, action) => {
    const result = await action('../../me/plans?x=');

    expect(result).toMatchObject({ ok: false, status: 404 });
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });
});
