import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { apiFetch } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({ apiFetch: vi.fn() }));

const mockedApiFetch = vi.mocked(apiFetch);

const ORIGIN = 'https://app.test';
const ORDER_ID = '8b1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b';
const TOKEN = '01ab23cd45ef67890123456789abcdef0123456789abcdef0123456789abcdef';
const BUY_ORDER = 'abcdef0123456789abcdef0123';

function getReturn(query: string) {
  return GET(new Request(`${ORIGIN}/api/webpay/return${query}`));
}

function postReturn(fields: Record<string, string>) {
  return POST(
    new Request(`${ORIGIN}/api/webpay/return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(fields).toString(),
    }),
  );
}

function commitResult(outcome: string, productType = 'GENERATED') {
  return { orderId: ORDER_ID, productType, outcome };
}

beforeEach(() => {
  mockedApiFetch.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('GET/POST /api/webpay/return', () => {
  it('con token_ws confirma el pago en el backend, sin token de sesión, y vuelve a la página de pago', async () => {
    mockedApiFetch.mockResolvedValue(commitResult('paid'));

    const response = await getReturn(`?token_ws=${TOKEN}`);

    expect(mockedApiFetch).toHaveBeenCalledWith('payments/webpay/commit', 'POST', {
      tokenWs: TOKEN,
      tbkToken: undefined,
      tbkBuyOrder: undefined,
    });
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(`/pago/${ORDER_ID}`);
  });

  it('acepta el retorno por POST (formulario) igual que por GET', async () => {
    mockedApiFetch.mockResolvedValue(commitResult('rejected'));

    const response = await postReturn({ token_ws: TOKEN });

    expect(mockedApiFetch).toHaveBeenCalledWith(
      'payments/webpay/commit',
      'POST',
      expect.objectContaining({ tokenWs: TOKEN }),
    );
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(`/pago/${ORDER_ID}`);
  });

  it('un plan predefinido vuelve con ?tipo=predefinido', async () => {
    mockedApiFetch.mockResolvedValue(commitResult('paid', 'PREDEFINED'));

    const response = await getReturn(`?token_ws=${TOKEN}`);

    expect(response.headers.get('location')).toBe(`/pago/${ORDER_ID}?tipo=predefinido`);
  });

  it('pago anulado (TBK_TOKEN): reenvía los parámetros y vuelve con ?resultado=anulado', async () => {
    mockedApiFetch.mockResolvedValue(commitResult('cancelled'));

    const response = await postReturn({ TBK_TOKEN: TOKEN, TBK_ORDEN_COMPRA: BUY_ORDER, TBK_ID_SESION: 'user-1' });

    expect(mockedApiFetch).toHaveBeenCalledWith('payments/webpay/commit', 'POST', {
      tokenWs: undefined,
      tbkToken: TOKEN,
      tbkBuyOrder: BUY_ORDER,
    });
    expect(response.headers.get('location')).toBe(`/pago/${ORDER_ID}?resultado=anulado`);
  });

  it.each([
    ['not_committed', 'no_cobrado'],
    ['needs_review', 'revision'],
  ])('resultado %s vuelve con ?resultado=%s', async (outcome, result) => {
    mockedApiFetch.mockResolvedValue(commitResult(outcome));

    const response = await getReturn(`?token_ws=${TOKEN}`);

    expect(response.headers.get('location')).toBe(`/pago/${ORDER_ID}?resultado=${result}`);
  });

  it.each([
    ['sin parámetros', ''],
    ['con un token con caracteres inválidos', '?token_ws=../../me'],
    ['con un token demasiado largo', `?token_ws=${'a'.repeat(65)}`],
  ])('%s no llama al backend y va a la página de error', async (_name, query) => {
    const response = await getReturn(query);

    expect(mockedApiFetch).not.toHaveBeenCalled();
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(`/pago/error`);
  });

  it('si la confirmación falla habiendo pagado, la página de error permite reintentar con el token', async () => {
    mockedApiFetch.mockRejectedValue(new Error('backend caído'));

    const response = await getReturn(`?token_ws=${TOKEN}`);

    expect(response.headers.get('location')).toBe(`/pago/error?token=${TOKEN}`);
  });

  it('si falla el registro de una anulación no ofrece reintentar (no hubo pago)', async () => {
    mockedApiFetch.mockRejectedValue(new Error('backend caído'));

    const response = await postReturn({ TBK_TOKEN: TOKEN, TBK_ORDEN_COMPRA: BUY_ORDER });

    expect(response.headers.get('location')).toBe(`/pago/error`);
  });

  it('no redirige a un orderId que no sea un UUID (el destino no sale de un valor arbitrario)', async () => {
    mockedApiFetch.mockResolvedValue({ orderId: '../login', productType: 'GENERATED', outcome: 'paid' });

    const response = await getReturn(`?token_ws=${TOKEN}`);

    expect(response.headers.get('location')).toBe(`/pago/error`);
  });
});
