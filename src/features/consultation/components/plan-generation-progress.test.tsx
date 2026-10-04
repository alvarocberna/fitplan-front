import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import {
  MAX_GENERATION_PROGRESS,
  PlanGenerationProgress,
  clearGenerationStart,
  generationProgress,
  getGenerationStart,
} from './plan-generation-progress';

describe('generationProgress', () => {
  it('parte en 0 y crece con el tiempo', () => {
    expect(generationProgress(0)).toBe(0);
    expect(generationProgress(-5000)).toBe(0);
    expect(generationProgress(60_000)).toBeGreaterThan(generationProgress(30_000));
    expect(generationProgress(180_000)).toBeGreaterThan(generationProgress(120_000));
  });

  it('cubre el rango de 2 a 3 minutos sin completarse', () => {
    expect(generationProgress(120_000)).toBeCloseTo(77.8, 1);
    expect(generationProgress(180_000)).toBeCloseTo(85.5, 1);
  });

  it('nunca alcanza el tope, por mucho que tarde', () => {
    expect(generationProgress(10 * 60_000)).toBeLessThan(MAX_GENERATION_PROGRESS);
    expect(MAX_GENERATION_PROGRESS).toBe(90);
  });
});

describe('getGenerationStart / clearGenerationStart', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
  });
  afterEach(() => vi.useRealTimers());

  it('recuerda el inicio por orden, y lo olvida al limpiar', () => {
    vi.setSystemTime(1_000_000);
    expect(getGenerationStart('order-1')).toBe(1_000_000);

    vi.setSystemTime(1_090_000);
    expect(getGenerationStart('order-1')).toBe(1_000_000);
    expect(getGenerationStart('order-2')).toBe(1_090_000);

    clearGenerationStart('order-1');
    expect(getGenerationStart('order-1')).toBe(1_090_000);
  });

  it('ignora un valor guardado inválido o del futuro', () => {
    vi.setSystemTime(1_000_000);
    sessionStorage.setItem('plan_generation_started_order-1', 'no-es-un-numero');
    expect(getGenerationStart('order-1')).toBe(1_000_000);

    sessionStorage.setItem('plan_generation_started_order-1', '9999999999999');
    expect(getGenerationStart('order-1')).toBe(1_000_000);
  });
});

describe('PlanGenerationProgress', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const value = () => Number(screen.getByRole('progressbar').getAttribute('aria-valuenow'));
  const advance = async (ms: number) => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  };

  it('muestra cuánto suele tardar y avanza con el tiempo', async () => {
    render(<PlanGenerationProgress startedAt={Date.now()} />);

    expect(screen.getByText(/suele tardar entre 2 y 3 minutos/)).toBeInTheDocument();
    expect(value()).toBe(0);
    expect(screen.getByText('Analizando tu información…')).toBeInTheDocument();

    await advance(60_000);
    expect(value()).toBe(56);
    expect(screen.getByText('56%')).toBeInTheDocument();
    expect(screen.getByText('Armando tus comidas…')).toBeInTheDocument();
  });

  it('nunca llega al 90%, aunque la generación se alargue', async () => {
    render(<PlanGenerationProgress startedAt={Date.now()} />);

    await advance(30 * 60_000);

    expect(value()).toBe(89);
    expect(screen.getByText('Preparando tu documento…')).toBeInTheDocument();
  });

  it('retoma el avance si la generación empezó antes (recarga de la página)', () => {
    render(<PlanGenerationProgress startedAt={Date.now() - 120_000} />);

    expect(value()).toBe(77);
  });
});
