import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RootError from '@/app/error';
import SesionError from '@/app/(sesion)/error';
import GlobalError from '@/app/global-error';
import { reportClientErrorAction } from '@/shared/errors/report-error.actions';

vi.mock('@/shared/errors/report-error.actions', () => ({
  reportClientErrorAction: vi.fn().mockResolvedValue(undefined),
}));

const report = vi.mocked(reportClientErrorAction);

function makeError(digest?: string) {
  return Object.assign(new Error('SELECT * FROM users — detalle interno'), digest ? { digest } : {});
}

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  report.mockClear();
  report.mockResolvedValue(undefined);
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
});

describe.each([
  ['error.tsx (raíz)', RootError, 'app'],
  ['(sesion)/error.tsx', SesionError, 'sesion'],
  ['global-error.tsx', GlobalError, 'global'],
] as const)('%s', (_name, Boundary, boundary) => {
  it('shows a generic message and the digest, never the error message or stack', () => {
    render(<Boundary error={makeError('digest-123')} reset={vi.fn()} />);

    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
    expect(screen.getByText('digest-123')).toBeInTheDocument();
    expect(screen.queryByText(/SELECT \* FROM users/)).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain('detalle interno');
  });

  it('does not claim the error was already notified to the team', () => {
    render(<Boundary error={makeError('digest-123')} reset={vi.fn()} />);

    expect(document.body.textContent).not.toMatch(/estamos al tanto|ya fue registrado/i);
  });

  it('omits the reference when Next generated no digest', () => {
    render(<Boundary error={makeError()} reset={vi.fn()} />);

    expect(screen.queryByText(/Referencia/)).not.toBeInTheDocument();
  });

  it('reports the error to the server with its digest and boundary', async () => {
    const error = makeError('digest-123');
    render(<Boundary error={error} reset={vi.fn()} />);

    await waitFor(() =>
      expect(report).toHaveBeenCalledWith(
        expect.objectContaining({ boundary, digest: 'digest-123', message: error.message, path: expect.any(String) }),
      ),
    );
  });

  it('still renders when the report itself fails', async () => {
    report.mockRejectedValue(new Error('server down'));
    render(<Boundary error={makeError('digest-123')} reset={vi.fn()} />);

    await waitFor(() => expect(report).toHaveBeenCalled());
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
  });

  it('"Reintentar" calls reset()', async () => {
    const reset = vi.fn();
    render(<Boundary error={makeError()} reset={reset} />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(reset).toHaveBeenCalledTimes(1);
  });
});
