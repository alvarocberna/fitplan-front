import { describe, it, expect } from 'vitest';
import { formatDateOnly, planDurationLabel } from './format';

describe('planDurationLabel', () => {
  it('cuenta meses completos entre las fechas del plan', () => {
    expect(planDurationLabel('2026-09-20T00:00:00.000Z', '2026-12-20T00:00:00.000Z')).toBe('3 meses');
    expect(planDurationLabel('2026-09-20T00:00:00.000Z', '2026-10-20T00:00:00.000Z')).toBe('1 mes');
  });

  it('no cuenta un mes incompleto (el día de término es anterior al de inicio)', () => {
    expect(planDurationLabel('2026-01-31T00:00:00.000Z', '2026-04-30T00:00:00.000Z')).toBe('2 meses');
  });

  it('bajo un mes usa días', () => {
    expect(planDurationLabel('2026-09-20T00:00:00.000Z', '2026-10-04T00:00:00.000Z')).toBe('14 días');
    expect(planDurationLabel('2026-09-20T00:00:00.000Z', '2026-09-21T00:00:00.000Z')).toBe('1 día');
  });

  it('sin fechas o con un término que no es posterior al inicio devuelve null', () => {
    expect(planDurationLabel('2026-09-20T00:00:00.000Z', null)).toBeNull();
    expect(planDurationLabel(null, '2026-12-20T00:00:00.000Z')).toBeNull();
    expect(planDurationLabel('2026-09-20T00:00:00.000Z', '2026-09-20T00:00:00.000Z')).toBeNull();
  });
});

describe('formatDateOnly', () => {
  it('muestra el día de la fecha DATE sin correrlo por la zona horaria', () => {
    expect(formatDateOnly('2026-09-20T00:00:00.000Z')).toBe('20/09/2026');
  });
});
